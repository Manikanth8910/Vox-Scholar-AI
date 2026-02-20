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
from app.services import openai_service, elevenlabs_service, edge_tts_service

router = APIRouter(prefix="/podcasts", tags=["Podcasts"])

# Directory for storing generated audio
AUDIO_DIR = os.path.join(settings.upload_dir, "podcasts")
os.makedirs(AUDIO_DIR, exist_ok=True)


@router.get("/voices")
async def get_voices():
    """Get available voices for podcast generation."""
    # Combine voices from ElevenLabs (Coqui) and Edge TTS
    voices = edge_tts_service.get_available_voices()
    # Add some popular ones from the other service if unique
    other_voices = elevenlabs_service.get_available_voices()
    
    seen_ids = {v['id'] for v in voices}
    for v in other_voices:
        if v['id'] not in seen_ids:
            voices.append(v)
            
    return voices


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
    
    # If podcast already exists, delete it and regenerate fresh
    existing = await podcast_crud.get_podcast_by_paper(db, request.paper_id, current_user.id)
    if existing:
        # Delete both possible extensions
        for ext in ["wav", "mp3"]:
            p = os.path.join(AUDIO_DIR, f"podcast_{existing.id}.{ext}")
            if os.path.exists(p):
                os.remove(p)
        await podcast_crud.delete_podcast(db, existing.id)
    
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
        # Resolve names for voices
        all_voices = edge_tts_service.get_available_voices() + elevenlabs_service.get_available_voices()
        male_name = "Prabhat"
        female_name = "Neerja"
        
        for v in all_voices:
            if v['id'] == request.voice_male:
                male_name = v['name'].split(' (')[0]
            if v['id'] == request.voice_female:
                female_name = v['name'].split(' (')[0]

        # Generate script
        script = await openai_service.generate_podcast_script(
            paper_title=paper.title,
            summary=paper.summary or "",
            key_findings=paper.key_findings or [],
            style=request.style,
            voice_male_name=male_name,
            voice_female_name=female_name
        )
        
        if not script:
            raise Exception("Failed to generate podcast script")
        
        # Determine which service to use based on voice ID
        # Edge TTS voices usually follow the en-XX-NameNeural pattern
        is_edge_voice = "-" in request.voice_male or "-" in request.voice_female
        
        if is_edge_voice:
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
        
        # Save audio file
        # Edge TTS produces MP3, Coqui produce WAV. 
        # For consistency, we'll use .mp3 for edge and .wav for coqui, or just check extension.
        ext = "mp3" if is_edge_voice else "wav"
        audio_filename = f"podcast_{podcast.id}.{ext}"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)
        
        async with aiofiles.open(audio_path, "wb") as f:
            await f.write(audio_bytes)
        
        audio_url = f"/api/podcasts/{podcast.id}/audio"
        
        # Generate transcript text
        transcript_text = "\n".join([
            f"[{entry.get('timestamp', '0:00')}] {entry.get('name', 'Speaker')}: {entry.get('text', '')}"
            for entry in script
        ])
        
        # Update podcast with audio data
        podcast = await podcast_crud.set_podcast_audio(
            db,
            podcast.id,
            audio_url=audio_url,           # store the API URL (/api/podcasts/{id}/audio)
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
    
    # Delete audio files if they exist
    for ext in ["wav", "mp3"]:
        p = os.path.join(AUDIO_DIR, f"podcast_{podcast_id}.{ext}")
        if os.path.exists(p):
            os.remove(p)
    
    # Delete from database
    await podcast_crud.delete_podcast(db, podcast_id)
    
    return MessageResponse(message="Podcast deleted successfully")


@router.get("/{podcast_id}/audio")
async def get_podcast_audio(
    podcast_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Stream podcast audio — no auth required (audio tag can't send headers)."""
    # Try mp3 first, then wav
    audio_file_path = os.path.join(AUDIO_DIR, f"podcast_{podcast_id}.mp3")
    media_type = "audio/mpeg"
    
    if not os.path.exists(audio_file_path):
        audio_file_path = os.path.join(AUDIO_DIR, f"podcast_{podcast_id}.wav")
        media_type = "audio/wav"

    if not os.path.exists(audio_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )

    # Best-effort play count increment
    try:
        await podcast_crud.increment_play_count(db, podcast_id)
    except Exception:
        pass

    from fastapi.responses import FileResponse
    return FileResponse(
        audio_file_path,
        media_type=media_type,
        filename=os.path.basename(audio_file_path)
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

