from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


async def get_user(db: AsyncSession, user_id: int) -> Optional[User]:
    """Get user by ID."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get user by email."""
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    """Get user by username."""
    result = await db.execute(
        select(User).where(User.username == username)
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """Create a new user."""
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        full_name=user_data.full_name,
    )
    db_user.set_password(user_data.password)
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


async def update_user(db: AsyncSession, user: User, user_data: UserUpdate) -> User:
    """Update user information."""
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: int) -> bool:
    """Delete a user."""
    user = await get_user(db, user_id)
    if user:
        await db.delete(user)
        await db.commit()
        return True
    return False


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Authenticate user by email and password."""
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not user.verify_password(password):
        return None
    return user


async def list_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[User]:
    """List all users."""
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def count_users(db: AsyncSession) -> int:
    """Count total users."""
    from sqlalchemy import func
    result = await db.execute(select(func.count(User.id)))
    return result.scalar() or 0

