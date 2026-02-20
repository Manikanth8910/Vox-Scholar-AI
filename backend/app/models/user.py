from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base, TimestampMixin
from app.core.security import get_password_hash


class UserRole(str, enum.Enum):
    """User role enum."""
    USER = "user"
    ADMIN = "admin"


class User(Base, TimestampMixin):
    """User model for authentication and profile."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    
    # Relationships
    papers = relationship("Paper", back_populates="user", cascade="all, delete-orphan")
    podcasts = relationship("Podcast", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    
    def set_password(self, password: str):
        """Set hashed password."""
        self.hashed_password = get_password_hash(password)
    
    def verify_password(self, password: str) -> bool:
        """Verify password."""
        from app.core.security import verify_password
        return verify_password(password, self.hashed_password)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"

