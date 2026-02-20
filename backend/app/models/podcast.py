from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base, TimestampMixin


class PodcastStatus(str, enum.Enum):
    """Podcast generation status."""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class Podcast(Base, TimestampMixin):
    """Podcast model - stores generated audio content from papers."""
    __tablename__ = "podcasts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False, index=True)
    
    # Podcast info
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    # Audio files
    audio_url = Column(String(1000), nullable=True)
    audio_duration = Column(Float, nullable=True)  # in seconds
    audio_size = Column(Integer, nullable=True)  # in bytes
    
    # Transcript
    transcript = Column(Text, nullable=True)
    transcript_json = Column(JSON, default=list)  # Structured transcript with timestamps
    
    # Generation settings
    voice_male = Column(String(100), nullable=True)  # ElevenLabs voice ID
    voice_female = Column(String(100), nullable=True)
    speed = Column(Float, default=1.0)
    style = Column(String(50), default="educational")  # educational, conversational, debate
    
    # Status
    status = Column(SQLEnum(PodcastStatus), default=PodcastStatus.PENDING)
    generation_error = Column(Text, nullable=True)
    
    # Usage stats
    play_count = Column(Integer, default=0)
    last_position = Column(Float, default=0.0)  # Playback progress in seconds
    last_played_at = Column(String(50), nullable=True)  # ISO timestamp
    
    # Relationships
    user = relationship("User", back_populates="podcasts")
    paper = relationship("Paper", back_populates="podcasts")
    
    def __repr__(self):
        return f"<Podcast(id={self.id}, title={self.title})>"


class TranscriptEntry(Base):
    """Transcript entry with speaker, text, and timestamp."""
    __tablename__ = "transcript_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    podcast_id = Column(Integer, ForeignKey("podcasts.id"), nullable=False, index=True)
    
    speaker = Column(String(50), nullable=False)  # "A", "B", "recap"
    speaker_name = Column(String(100), nullable=True)  # "Dr. Chen", "Prof. Aria"
    text = Column(Text, nullable=False)
    timestamp_start = Column(String(20), nullable=False)  # "0:00"
    timestamp_seconds = Column(Float, nullable=False)
    is_recap = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<TranscriptEntry(speaker={self.speaker}, text={self.text[:50]}...)>"

