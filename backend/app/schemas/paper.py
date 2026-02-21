from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PaperBase(BaseModel):
    """Base paper schema."""
    title: str = Field(..., min_length=1, max_length=500)


class PaperCreate(PaperBase):
    """Paper creation schema (for internal use after file upload)."""
    filename: str
    file_path: str
    file_size: int
    mime_type: str = "application/pdf"
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    doi: Optional[str] = None


class PaperUpdate(BaseModel):
    """Paper update schema."""
    title: Optional[str] = None
    summary: Optional[str] = None
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    reading_progress: Optional[int] = Field(None, ge=0, le=100)


class PaperResponse(PaperBase):
    """Paper response schema."""
    id: int
    user_id: int
    filename: str
    file_size: int
    mime_type: str
    summary: Optional[str] = None
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    journal: Optional[str] = None
    doi: Optional[str] = None
    is_processed: bool
    processing_status: str
    reading_progress: int
    has_podcast: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PaperDetail(PaperResponse):
    """Detailed paper response with AI analysis."""
    raw_text: Optional[str] = None
    topics: List[str] = []
    key_findings: List[str] = []
    methodology: Optional[str] = None
    
    class Config:
        from_attributes = True


class PaperListResponse(BaseModel):
    """List of papers with metadata."""
    id: int
    title: str
    filename: str
    summary: Optional[str] = None
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    reading_progress: int
    is_processed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaperUploadResponse(BaseModel):
    """Response after paper upload."""
    paper_id: int
    title: str
    message: str


class PaperProcessingStatus(BaseModel):
    """Paper processing status."""
    paper_id: int
    status: str
    progress: int = 0  # 0-100
    message: Optional[str] = None

