from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base, TimestampMixin


class Note(Base, TimestampMixin):
    """Research notes model."""
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=True, index=True)
    
    # Note content
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)  # Markdown content
    
    # Organization
    tags = Column(JSON, default=list)  # List of tags
    is_public = Column(Boolean, default=False)
    
    # Note metadata
    word_count = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="notes")
    paper = relationship("Paper", back_populates="notes")
    
    def __repr__(self):
        return f"<Note(id={self.id}, title={self.title})>"


class ChatMessage(Base, TimestampMixin):
    """Chat message model for Q&A interactions."""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=True, index=True)
    
    # Message content
    role = Column(String(20), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    
    # Token usage (for tracking costs)
    tokens_used = Column(Integer, default=0)
    
    # Context (for RAG)
    context_sources = Column(JSON, default=list)  # Source chunks used for answer
    
    # Relationships
    user = relationship("User", back_populates="chat_messages")
    paper = relationship("Paper", back_populates="chat_messages")
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, role={self.role})>"

