from typing import Optional, List
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.note import Note, ChatMessage
from app.schemas.note import NoteCreate, NoteUpdate


# ============ Notes CRUD ============

async def get_note(db: AsyncSession, note_id: int) -> Optional[Note]:
    """Get note by ID."""
    result = await db.execute(
        select(Note).where(Note.id == note_id)
    )
    return result.scalar_one_or_none()


async def create_note(
    db: AsyncSession, 
    user_id: int, 
    note_data: NoteCreate
) -> Note:
    """Create a new note."""
    word_count = len(note_data.content.split())
    
    db_note = Note(
        user_id=user_id,
        paper_id=note_data.paper_id,
        title=note_data.title,
        content=note_data.content,
        tags=note_data.tags,
        is_public=note_data.is_public,
        word_count=word_count,
    )
    
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note


async def update_note(
    db: AsyncSession, 
    note: Note, 
    note_data: NoteUpdate
) -> Note:
    """Update note information."""
    update_data = note_data.model_dump(exclude_unset=True)
    
    # Recalculate word count if content changed
    if "content" in update_data:
        update_data["word_count"] = len(update_data["content"].split())
    
    for field, value in update_data.items():
        setattr(note, field, value)
    
    await db.commit()
    await db.refresh(note)
    return note


async def delete_note(db: AsyncSession, note_id: int) -> bool:
    """Delete a note."""
    note = await get_note(db, note_id)
    if note:
        await db.delete(note)
        await db.commit()
        return True
    return False


async def list_user_notes(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
    paper_id: Optional[int] = None
) -> List[Note]:
    """List all notes for a user."""
    query = select(Note).where(Note.user_id == user_id).order_by(desc(Note.updated_at))
    
    if paper_id:
        query = query.where(Note.paper_id == paper_id)
    
    result = await db.execute(
        query.offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def count_user_notes(db: AsyncSession, user_id: int) -> int:
    """Count total notes for a user."""
    result = await db.execute(
        select(func.count(Note.id)).where(Note.user_id == user_id)
    )
    return result.scalar() or 0


# ============ Chat Messages CRUD ============

async def get_chat_message(db: AsyncSession, message_id: int) -> Optional[ChatMessage]:
    """Get chat message by ID."""
    result = await db.execute(
        select(ChatMessage).where(ChatMessage.id == message_id)
    )
    return result.scalar_one_or_none()


async def create_chat_message(
    db: AsyncSession,
    user_id: int,
    role: str,
    content: str,
    paper_id: Optional[int] = None,
    tokens_used: int = 0,
    context_sources: list = None
) -> ChatMessage:
    """Create a new chat message."""
    db_message = ChatMessage(
        user_id=user_id,
        paper_id=paper_id,
        role=role,
        content=content,
        tokens_used=tokens_used,
        context_sources=context_sources or [],
    )
    
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    return db_message


async def list_paper_chat_history(
    db: AsyncSession,
    paper_id: int,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[ChatMessage]:
    """Get chat history for a paper."""
    result = await db.execute(
        select(ChatMessage)
        .where(
            ChatMessage.paper_id == paper_id,
            ChatMessage.user_id == user_id
        )
        .order_by(ChatMessage.created_at)
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def list_user_chat_history(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> List[ChatMessage]:
    """Get all chat history for a user."""
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_paper_messages(
    db: AsyncSession,
    paper_id: int,
    user_id: int
) -> int:
    """Count messages for a paper."""
    result = await db.execute(
        select(func.count(ChatMessage.id)).where(
            ChatMessage.paper_id == paper_id,
            ChatMessage.user_id == user_id
        )
    )
    return result.scalar() or 0


async def count_user_messages(db: AsyncSession, user_id: int) -> int:
    """Count total messages for a user."""
    result = await db.execute(
        select(func.count(ChatMessage.id)).where(ChatMessage.user_id == user_id)
    )
    return result.scalar() or 0

