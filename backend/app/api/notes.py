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
        
        # Check if note already exists for this paper - Enforce "1 note per paper"
        existing_notes = await note_crud.list_user_notes(db, current_user.id, paper_id=note_data.paper_id)
        if existing_notes:
            existing = existing_notes[0]
            # Perform an update (upsert behavior)
            from app.schemas.note import NoteUpdate
            update_data = NoteUpdate(
                title=note_data.title,
                content=note_data.content,
                tags=note_data.tags,
                is_public=note_data.is_public
            )
            return await note_crud.update_note(db, existing, update_data)
    
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


# ============ Chat / Q&A Endpoints ============

@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Send a chat message and get AI response."""
    # Get context from paper if provided
    context = ""
    sources = []
    
    if request.paper_id:
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
        
        if not paper.raw_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Paper has not been processed yet"
            )
        
        context = paper.raw_text
    
    # Build chat history
    chat_history = None
    if request.chat_history:
        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.chat_history[-10:]
        ]
    
    # Get AI response
    response_text, tokens_used = await openai_service.chat(
        message=request.message,
        context=context,
        chat_history=chat_history
    )
    
    # Save user message
    await note_crud.create_chat_message(
        db,
        user_id=current_user.id,
        role="user",
        content=request.message,
        paper_id=request.paper_id,
        tokens_used=0
    )
    
    # Save AI response
    await note_crud.create_chat_message(
        db,
        user_id=current_user.id,
        role="assistant",
        content=response_text,
        paper_id=request.paper_id,
        tokens_used=tokens_used,
        context_sources=sources
    )
    
    return ChatResponse(
        message=response_text,
        sources=sources,
        tokens_used=tokens_used
    )


@router.get("/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    paper_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat history."""
    if paper_id:
        # Verify paper access
        paper = await paper_crud.get_paper(db, paper_id)
        if not paper or paper.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Paper not found"
            )
        
        messages = await note_crud.list_paper_chat_history(
            db, paper_id, current_user.id, skip, limit
        )
    else:
        messages = await note_crud.list_user_chat_history(
            db, current_user.id, skip, limit
        )
    
    total = len(messages)
    
    return ChatHistoryResponse(
        messages=messages,
        total=total
    )


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
    
    # Create or update note - Enforce "1 note per paper"
    existing_notes = await note_crud.list_user_notes(db, current_user.id, paper_id=paper_id)
    
    if existing_notes:
        existing = existing_notes[0]
        from app.schemas.note import NoteUpdate
        update_data = NoteUpdate(
            title=f"Study Notes: {paper.title}",
            content=notes_content, # potentially append or replace. User said "1 note", so replace/update is best.
            tags=list(set((existing.tags or []) + ["generated", "study-notes"]))
        )
        note = await note_crud.update_note(db, existing, update_data)
    else:
        note_data = NoteCreate(
            paper_id=paper_id,
            title=f"Study Notes: {paper.title}",
            content=notes_content,
            tags=["generated", "study-notes"],
            is_public=False
        )
        note = await note_crud.create_note(db, current_user.id, note_data)
    
    return note

