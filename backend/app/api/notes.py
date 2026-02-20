from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud import note as note_crud
from app.crud import paper as paper_crud
from app.schemas import (
    NoteResponse,
    NoteCreate,
    NoteUpdate,
    NoteListResponse,
    ChatMessageResponse,
    ChatRequest,
    ChatResponse,
    ChatHistoryResponse,
    MessageResponse,
)
from app.models.user import User
from app.services import openai_service

router = APIRouter(tags=["Notes & Chat"])


# ============ Notes Endpoints ============

@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    note_data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new note."""
    # Verify paper belongs to user if paper_id provided
    if note_data.paper_id:
        paper = await paper_crud.get_paper(db, note_data.paper_id)
        if not paper or paper.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paper not found"
            )
    
    note = await note_crud.create_note(db, current_user.id, note_data)
    return note


@router.get("/notes", response_model=List[NoteListResponse])
async def list_notes(
    skip: int = 0,
    limit: int = 50,
    paper_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all notes for the current user."""
    notes = await note_crud.list_user_notes(
        db, current_user.id, skip, limit, paper_id
    )
    
    # Build response with paper titles
    result = []
    for note in notes:
        paper_title = None
        if note.paper_id:
            paper = await paper_crud.get_paper(db, note.paper_id)
            paper_title = paper.title if paper else None
        
        result.append(NoteListResponse(
            id=note.id,
            title=note.title,
            content_preview=note.content[:100] if note.content else "",
            tags=note.tags or [],
            paper_title=paper_title,
            word_count=note.word_count,
            created_at=note.created_at
        ))
    
    return result


@router.get("/notes/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get note details."""
    note = await note_crud.get_note(db, note_id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    if note.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this note"
        )
    
    return note


@router.put("/notes/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update note."""
    note = await note_crud.get_note(db, note_id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    if note.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this note"
        )
    
    note = await note_crud.update_note(db, note, note_data)
    return note


@router.delete("/notes/{note_id}", response_model=MessageResponse)
async def delete_note(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a note."""
    note = await note_crud.get_note(db, note_id)
    
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    if note.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this note"
        )
    
    await note_crud.delete_note(db, note_id)
    return MessageResponse(message="Note deleted successfully")


# ============ Chat / Q&A Endpoints Moved to api/chat.py ============


@router.post("/notes/generate", response_model=NoteResponse)
async def generate_study_notes(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate AI-powered study notes from a paper."""
    paper = await paper_crud.get_paper(db, paper_id)
    
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
            detail="Paper must be processed first"
        )
    
    # Generate study notes
    notes_content = await openai_service.generate_study_notes(
        text=paper.raw_text or "",
        title=paper.title
    )
    
    # Create note
    note_data = NoteCreate(
        paper_id=paper_id,
        title=f"Study Notes: {paper.title}",
        content=notes_content,
        tags=["generated", "study-notes"],
        is_public=False
    )
    
    note = await note_crud.create_note(db, current_user.id, note_data)
    return note

