from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.crud import user as user_crud
from app.crud import paper as paper_crud
from app.crud import podcast as podcast_crud
from app.crud import note as note_crud
from app.schemas import UserProfile, UserUpdate, MessageResponse
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user profile with stats."""
    # Get counts
    papers_count = await paper_crud.count_user_papers(db, current_user.id)
    podcasts_count = await podcast_crud.count_user_podcasts(db, current_user.id)
    notes_count = await note_crud.count_user_notes(db, current_user.id)
    questions_asked = await note_crud.count_user_messages(db, current_user.id)
    
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        papers_count=papers_count,
        podcasts_count=podcasts_count,
        notes_count=notes_count,
        questions_asked=questions_asked
    )


@router.put("/profile", response_model=UserProfile)
async def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile."""
    # Check username uniqueness if changing
    if user_data.username and user_data.username != current_user.username:
        existing = await user_crud.get_user_by_username(db, user_data.username)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    user = await user_crud.update_user(db, current_user, user_data)
    
    # Get updated counts
    papers_count = await paper_crud.count_user_papers(db, current_user.id)
    podcasts_count = await podcast_crud.count_user_podcasts(db, current_user.id)
    notes_count = await note_crud.count_user_notes(db, current_user.id)
    questions_asked = await note_crud.count_user_messages(db, current_user.id)
    
    return UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        role=user.role.value,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        updated_at=user.updated_at,
        papers_count=papers_count,
        podcasts_count=podcasts_count,
        notes_count=notes_count,
        questions_asked=questions_asked
    )


@router.delete("/profile", response_model=MessageResponse)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete user account."""
    # In production, you might want to soft-delete or require password confirmation
    await user_crud.delete_user(db, current_user.id)
    return MessageResponse(message="Account deleted successfully")


@router.get("/stats", response_model=dict)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user statistics."""
    papers_count = await paper_crud.count_user_papers(db, current_user.id)
    podcasts_count = await podcast_crud.count_user_podcasts(db, current_user.id)
    notes_count = await note_crud.count_user_notes(db, current_user.id)
    questions_asked = await note_crud.count_user_messages(db, current_user.id)
    
    # Calculate research hours (estimated)
    # Assume avg paper takes 2 hours to study
    research_hours = papers_count * 2
    
    return {
        "papers_count": papers_count,
        "podcasts_count": podcasts_count,
        "notes_count": notes_count,
        "questions_asked": questions_asked,
        "research_hours": research_hours
    }

