import os
import aiofiles
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.crud import podcast as podcast_crud
from app.crud import paper as paper_crud
from app.schemas import (
    PodcastResponse,
    PodcastDetail,
    PodcastCreate,
    PodcastUpdate,
    PodcastGenerationRequest,
    PodcastGenerationStatus,
    MessageResponse,
)
from app.models.user import User
from app.models.podcast import PodcastStatus
from app.services.openai_service import openai_service
from app.services.elevenlabs_service import elevenlabs_service
from app.services.storage_service import storage_service
from app.services.edge_tts_service import edge_tts_service

router = APIRouter(prefix="/podcasts", tags=["Podcasts"])

# Directory for storing generated audio
AUDIO_DIR = os.path.join(settings.upload_dir, "podcasts")
os.makedirs(AUDIO_DIR, exist_ok=True)


@router.post("/generate", response_model=PodcastGenerationStatus)
async def generate_podcast(
    request: PodcastGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a podcast from a paper."""
    # Get paper
    paper = await paper_crud.get_paper(db, request.paper_id)
    
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    if paper.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this paper"
        )
    
    if not paper.is_processed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paper must be processed before generating podcast"
        )
    
    # Check if podcast already exists
    existing = await podcast_crud.get_podcast_by_paper(db, request.paper_id, current_user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Podcast already exists for this paper"
        )
    
    # Create podcast record
    podcast_data = PodcastCreate(
        paper_id=request.paper_id,
        title=f"Podcast: {paper.title}",
        description=f"AI-generated podcast summarizing {paper.title}",
        voice_male=request.voice_male,
        voice_female=request.voice_female,
        speed=request.speed,
        style=request.style,
    )
    
    podcast = await podcast_crud.create_podcast(db, current_user.id, podcast_data)
    
    # Update status to generating
    await podcast_crud.update_podcast_status(db, podcast.id, PodcastStatus.GENERATING)
    
    try:
        # Resolve voice names — prefer custom persona names if provided
        all_voices = edge_tts_service.get_available_voices() + elevenlabs_service.get_available_voices()
        male_name = request.persona_male_name or "Prabhat"
        female_name = request.persona_female_name or "Neerja"
        
        # Only fall back to voice name if no custom persona name is set
        if not request.persona_male_name or not request.persona_female_name:
            for v in all_voices:
                if v['id'] == request.voice_male and not request.persona_male_name:
                    male_name = v['name'].split(' (')[0]
                if v['id'] == request.voice_female and not request.persona_female_name:
                    female_name = v['name'].split(' (')[0]

        # Generate script with personas
        script = await openai_service.generate_podcast_script(
            paper_title=paper.title,
            summary=paper.summary or "",
            key_findings=paper.key_findings or [],
            style=request.style,
            voice_male_name=male_name,
            voice_female_name=female_name,
            persona_male_style=request.persona_male_style,
            persona_female_style=request.persona_female_style,
        )
        
        if not script:
            raise Exception("Failed to generate podcast script")
        
        # Generate audio based on voice type
        if request.voice_male and request.voice_male.startswith("en-"):
            audio_bytes, duration = await edge_tts_service.generate_podcast_audio(
                script=script,
                voice_male=request.voice_male,
                voice_female=request.voice_female,
                speed=request.speed
            )
        else:
            audio_bytes, duration = await elevenlabs_service.generate_podcast_audio(
                script=script,
                voice_male=request.voice_male,
                voice_female=request.voice_female,
                speed=request.speed
            )
        
        # Upload audio to storage (Cloudinary or local)
        audio_filename = f"podcast_{podcast.id}.mp3"
        audio_url, local_path = await storage_service.upload_audio(
            audio_bytes=audio_bytes,
            filename=audio_filename,
            folder="podcasts"
        )
        
        # Generate transcript text
        transcript_text = "\n".join([
            f"[{entry.get('timestamp', '0:00')}] {entry.get('name', 'Speaker')}: {entry.get('text', '')}"
            for entry in script
        ])
        
        # Update podcast with audio data
        podcast = await podcast_crud.set_podcast_audio(
            db,
            podcast.id,
            audio_url=local_path,  # Back to local_path because FileResponse needs it
            audio_duration=duration,
            audio_size=len(audio_bytes),
            transcript=transcript_text,
            transcript_json=script
        )
        
        return PodcastGenerationStatus(
            podcast_id=podcast.id,
            status="completed",
            progress=100,
            audio_url=audio_url,
            message="Podcast generated successfully"
        )
    
    except Exception as e:
        await podcast_crud.update_podcast_status(
            db, podcast.id, PodcastStatus.FAILED, error=str(e)
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating podcast: {str(e)}"
        )


@router.get("", response_model=List[PodcastResponse])
async def list_podcasts(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[PodcastStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all podcasts for the current user."""
    podcasts = await podcast_crud.list_user_podcasts(
        db, current_user.id, skip, limit, status_filter
    )
    return podcasts


@router.get("/{podcast_id}", response_model=PodcastDetail)
async def get_podcast(
    podcast_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get podcast details."""
    podcast = await podcast_crud.get_podcast(db, podcast_id)
    
    if not podcast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Podcast not found"
        )
    
    if podcast.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this podcast"
        )
    
    return podcast


@router.put("/{podcast_id}", response_model=PodcastResponse)
async def update_podcast(
    podcast_id: int,
    podcast_data: PodcastUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update podcast details."""
    podcast = await podcast_crud.get_podcast(db, podcast_id)
    
    if not podcast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Podcast not found"
        )
    
    if podcast.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this podcast"
        )
    
    podcast = await podcast_crud.update_podcast(db, podcast, podcast_data)
    return podcast


@router.delete("/{podcast_id}", response_model=MessageResponse)
async def delete_podcast(
    podcast_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a podcast."""
    podcast = await podcast_crud.get_podcast(db, podcast_id)
    
    if not podcast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Podcast not found"
        )
    
    if podcast.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this podcast"
        )
    
    # Delete audio file if exists
    if podcast.audio_url and os.path.exists(podcast.audio_url):
        os.remove(podcast.audio_url)
    
    # Delete from database
    await podcast_crud.delete_podcast(db, podcast_id)
    
    return MessageResponse(message="Podcast deleted successfully")


@router.get("/{podcast_id}/audio")
async def get_podcast_audio(
    podcast_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get podcast audio file."""
    podcast = await podcast_crud.get_podcast(db, podcast_id)
    
    if not podcast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Podcast not found"
        )
    
    # Note: Authorization check removed to allow standard HTML5 <audio> tag 
    # to fetch the stream without headers (since browsers don't send auth headers on media tags)
    
    if not podcast.audio_url or not os.path.exists(podcast.audio_url):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )
    
    # Increment play count
    await podcast_crud.increment_play_count(db, podcast_id)
    
    # Return file
    from fastapi.responses import FileResponse
    return FileResponse(
        podcast.audio_url,
        media_type="audio/mpeg",
        filename=f"podcast_{podcast_id}.mp3"
    )


@router.post("/{podcast_id}/play", response_model=MessageResponse)
async def record_play(
    podcast_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a play event for the podcast."""
    podcast = await podcast_crud.get_podcast(db, podcast_id)
    
    if not podcast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Podcast not found"
        )
    
    if podcast.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this podcast"
        )
    
    await podcast_crud.increment_play_count(db, podcast_id)
    
    return MessageResponse(message="Play recorded")

