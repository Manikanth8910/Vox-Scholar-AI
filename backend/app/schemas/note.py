from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class NoteBase(BaseModel):
    """Base note schema."""
    title: str = Field(..., min_length=1, max_length=500)


class NoteCreate(NoteBase):
    """Note creation schema."""
    paper_id: Optional[int] = None
    content: str = ""
    tags: List[str] = []
    is_public: bool = False


class NoteUpdate(BaseModel):
    """Note update schema."""
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class NoteResponse(NoteBase):
    """Note response schema."""
    id: int
    user_id: int
    paper_id: Optional[int] = None
    content: str
    tags: List[str]
    is_public: bool
    word_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    """List of notes."""
    id: int
    title: str
    content_preview: str  # First 100 chars
    tags: List[str]
    paper_title: Optional[str] = None
    word_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Chat / Q&A Schemas ============

class ChatMessageBase(BaseModel):
    """Base chat message schema."""
    content: str


class ChatMessageCreate(ChatMessageBase):
    """Chat message creation schema."""
    paper_id: Optional[int] = None


class ChatMessageResponse(ChatMessageBase):
    """Chat message response."""
    id: int
    user_id: int
    paper_id: Optional[int] = None
    role: str
    tokens_used: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatHistoryMessage(BaseModel):
    """Simple chat history message (role + content)."""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Chat request for Q&A."""
    message: str
    paper_id: Optional[int] = None
    chat_history: Optional[List[ChatHistoryMessage]] = None


class ChatResponse(BaseModel):
    """Chat response."""
    message: str
    sources: List[dict] = []  # Source chunks used
    tokens_used: int = 0


class ChatHistoryResponse(BaseModel):
    """Chat history response."""
    messages: List[ChatMessageResponse]
    total: int

