from typing import Optional, List
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.podcast import Podcast, PodcastStatus
from app.schemas.podcast import PodcastCreate, PodcastUpdate


async def get_podcast(db: AsyncSession, podcast_id: int) -> Optional[Podcast]:
    """Get podcast by ID."""
    result = await db.execute(
        select(Podcast).where(Podcast.id == podcast_id)
    )
    return result.scalar_one_or_none()


async def get_podcast_by_paper(db: AsyncSession, paper_id: int, user_id: int) -> Optional[Podcast]:
    """Get podcast for a specific paper."""
    result = await db.execute(
        select(Podcast).where(
            Podcast.paper_id == paper_id,
            Podcast.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_podcast(
    db: AsyncSession, 
    user_id: int, 
    podcast_data: PodcastCreate
) -> Podcast:
    """Create a new podcast."""
    db_podcast = Podcast(
        user_id=user_id,
        paper_id=podcast_data.paper_id,
        title=podcast_data.title,
        description=podcast_data.description,
        voice_male=podcast_data.voice_male,
        voice_female=podcast_data.voice_female,
        speed=podcast_data.speed,
        style=podcast_data.style,
    )
    
    db.add(db_podcast)
    await db.commit()
    await db.refresh(db_podcast)
    return db_podcast


async def update_podcast(
    db: AsyncSession, 
    podcast: Podcast, 
    podcast_data: PodcastUpdate
) -> Podcast:
    """Update podcast information."""
    update_data = podcast_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(podcast, field, value)
    
    await db.commit()
    await db.refresh(podcast)
    return podcast


async def update_podcast_status(
    db: AsyncSession,
    podcast_id: int,
    status: PodcastStatus,
    error: Optional[str] = None
) -> Optional[Podcast]:
    """Update podcast status."""
    podcast = await get_podcast(db, podcast_id)
    if podcast:
        podcast.status = status
        if error:
            podcast.generation_error = error
        await db.commit()
        await db.refresh(podcast)
    return podcast


async def set_podcast_audio(
    db: AsyncSession,
    podcast_id: int,
    audio_url: str,
    audio_duration: float,
    audio_size: int,
    transcript: str,
    transcript_json: list
) -> Optional[Podcast]:
    """Set podcast audio data after generation."""
    podcast = await get_podcast(db, podcast_id)
    if podcast:
        podcast.audio_url = audio_url
        podcast.audio_duration = audio_duration
        podcast.audio_size = audio_size
        podcast.transcript = transcript
        podcast.transcript_json = transcript_json
        podcast.status = PodcastStatus.COMPLETED
        await db.commit()
        await db.refresh(podcast)
    return podcast


async def delete_podcast(db: AsyncSession, podcast_id: int) -> bool:
    """Delete a podcast."""
    podcast = await get_podcast(db, podcast_id)
    if podcast:
        await db.delete(podcast)
        await db.commit()
        return True
    return False


async def list_user_podcasts(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    status: Optional[PodcastStatus] = None
) -> List[Podcast]:
    """List all podcasts for a user."""
    query = select(Podcast).where(Podcast.user_id == user_id).order_by(desc(Podcast.created_at))
    
    if status:
        query = query.where(Podcast.status == status)
    
    result = await db.execute(
        query.offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def count_user_podcasts(db: AsyncSession, user_id: int) -> int:
    """Count total podcasts for a user."""
    result = await db.execute(
        select(func.count(Podcast.id)).where(Podcast.user_id == user_id)
    )
    return result.scalar() or 0


async def increment_play_count(db: AsyncSession, podcast_id: int) -> Optional[Podcast]:
    """Increment play count for a podcast."""
    podcast = await get_podcast(db, podcast_id)
    if podcast:
        podcast.play_count += 1
        await db.commit()
        await db.refresh(podcast)
    return podcast

