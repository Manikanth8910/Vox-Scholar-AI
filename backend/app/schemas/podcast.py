from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TranscriptEntrySchema(BaseModel):
    """Transcript entry schema."""
    speaker: str
    speaker_name: Optional[str] = None
    text: str
    timestamp_start: str
    timestamp_seconds: float
    is_recap: bool = False
    
    class Config:
        from_attributes = True


class PodcastBase(BaseModel):
    """Base podcast schema."""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None


class PodcastCreate(PodcastBase):
    """Podcast creation schema."""
    paper_id: int
    voice_male: Optional[str] = None
    voice_female: Optional[str] = None
    speed: float = Field(1.0, ge=0.5, le=2.0)
    style: str = "educational"


class PodcastUpdate(BaseModel):
    """Podcast update schema."""
    title: Optional[str] = None
    description: Optional[str] = None
    voice_male: Optional[str] = None
    voice_female: Optional[str] = None
    speed: Optional[float] = Field(None, ge=0.5, le=2.0)
    style: Optional[str] = None


class PodcastResponse(PodcastBase):
    """Podcast response schema."""
    id: int
    user_id: int
    paper_id: int
    audio_url: Optional[str] = None
    audio_duration: Optional[float] = None
    audio_size: Optional[int] = None
    transcript: Optional[str] = None
    voice_male: Optional[str] = None
    voice_female: Optional[str] = None
    speed: float
    style: str
    status: str
    play_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PodcastDetail(PodcastResponse):
    """Detailed podcast with transcript."""
    transcript_json: List[TranscriptEntrySchema] = []
    
    class Config:
        from_attributes = True


class PodcastListResponse(BaseModel):
    """List of podcasts."""
    id: int
    title: str
    description: Optional[str] = None
    audio_url: Optional[str] = None
    audio_duration: Optional[float] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class PodcastGenerationRequest(BaseModel):
    """Request to generate a podcast."""
    paper_id: int
    voice_male: Optional[str] = None
    voice_female: Optional[str] = None
    speed: float = Field(1.0, ge=0.5, le=2.0)
    style: str = "educational"


class PodcastGenerationStatus(BaseModel):
    """Podcast generation status."""
    podcast_id: int
    status: str
    progress: int = 0  # 0-100
    audio_url: Optional[str] = None
    message: Optional[str] = None

