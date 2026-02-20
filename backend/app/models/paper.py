from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class Paper(Base, TimestampMixin):
    """Research paper model - stores PDF metadata and extracted content."""
    __tablename__ = "papers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # File info
    title = Column(String(500), nullable=False)
    filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    mime_type = Column(String(100), default="application/pdf")
    
    # Extracted content
    raw_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    
    # Metadata
    authors = Column(Text, nullable=True)  # Comma-separated
    publication_year = Column(Integer, nullable=True)
    journal = Column(String(500), nullable=True)
    doi = Column(String(100), nullable=True)
    
    # Processing status
    is_processed = Column(Boolean, default=False)
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    processing_error = Column(Text, nullable=True)
    
    # AI Analysis
    topics = Column(JSON, default=list)  # List of detected topics
    key_findings = Column(JSON, default=list)  # Key findings from paper
    methodology = Column(Text, nullable=True)
    
    # Reading progress (0-100)
    reading_progress = Column(Integer, default=0)
    
    # Embeddings for semantic search (stored as JSON for simplicity)
    embeddings = Column(JSON, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="papers")
    podcasts = relationship("Podcast", back_populates="paper", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="paper", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="paper", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Paper(id={self.id}, title={self.title})>"

