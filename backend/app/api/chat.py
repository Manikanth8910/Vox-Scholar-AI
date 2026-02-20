from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud import paper as paper_crud
from app.crud import note as note_crud
from app.models.user import User
from app.services import openai_service

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatMessageSchema(BaseModel):
    """Chat message schema for incoming history."""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Chat request schema."""
    paper_id: int
    message: str
    chat_history: Optional[List[ChatMessageSchema]] = []


class ChatResponse(BaseModel):
    """Chat response schema."""
    message: str
    tokens_used: int


class ChatHistoryItem(BaseModel):
    """Single chat message in history response."""
    role: str
    content: str
    created_at: str


class ChatHistoryResponse(BaseModel):
    """Chat history response schema."""
    messages: List[ChatHistoryItem]


@router.post("", response_model=ChatResponse)
async def chat_with_paper(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Chat with AI about a paper using RAG."""
    # Get paper
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
        # Fallback if paper exists but raw_text isn't indexed yet
        # If is_processed is true but raw_text is missing, we use a default
        if not paper.is_processed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Paper must be processed before chatting"
            )
    
    try:
        # 1. Save User Message
        await note_crud.create_chat_message(
            db,
            user_id=current_user.id,
            role="user",
            content=request.message,
            paper_id=request.paper_id
        )

        # 2. Convert chat history to dict format for the AI service
        history = [{"role": msg.role, "content": msg.content} for msg in request.chat_history]
        
        # 3. Get response from AI
        response_text, tokens = await openai_service.chat(
            message=request.message,
            context=paper.raw_text or f"Title: {paper.title}. Summary: {paper.summary}",
            chat_history=history
        )
        
        # 4. Save AI Response
        await note_crud.create_chat_message(
            db,
            user_id=current_user.id,
            role="assistant",
            content=response_text,
            paper_id=request.paper_id,
            tokens_used=tokens
        )
        
        return ChatResponse(
            message=response_text,
            tokens_used=tokens
        )
    
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat: {str(e)}"
        )


@router.get("/history/{paper_id}", response_model=ChatHistoryResponse)
async def get_history(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get chat history for a specific paper."""
    messages = await note_crud.list_paper_chat_history(db, paper_id, current_user.id)
    
    # Format for response
    formatted_messages = [
        ChatHistoryItem(
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at.isoformat()
        )
        for msg in messages
    ]
    
    return ChatHistoryResponse(messages=formatted_messages)
