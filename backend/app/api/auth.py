from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel

from app.core.database import get_db
from app.core.security import (
    get_current_user,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings
from app.crud import user as user_crud
from app.schemas import (
    Token,
    LoginRequest,
    RegisterRequest,
    MessageResponse,
    UserResponse,
    RefreshTokenRequest,
    UserProfile,
)
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

class GoogleLoginRequest(BaseModel):
    credential: str

@router.post("/google", response_model=Token)
async def google_auth(
    request: GoogleLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate via Google OAuth."""
    try:
        idinfo = id_token.verify_oauth2_token(
            request.credential, 
            requests.Request(),
            audience=settings.google_client_id
        )
        email = idinfo.get('email')
        name = idinfo.get('name', 'Google User')
        
        if not email:
            raise ValueError("No email found in token")
            
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")

    user = await user_crud.get_user_by_email(db, email)
    if not user:
        # Auto-create the user
        import uuid
        
        # generate random fake password
        fake_pass = str(uuid.uuid4())
        
        # Generate username from email or name
        username = email.split('@')[0]
        # In case username exists, add a suffix
        existing = await user_crud.get_user_by_username(db, username)
        if existing:
            username = f"{username}_{str(uuid.uuid4())[:4]}"

        user_data = RegisterRequest(
            email=email,
            password=fake_pass,
            full_name=name,
            username=username
        )
        user = await user_crud.create_user(db, user_data)
        
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )



@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    # Check if email exists
    existing_user = await user_crud.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    if user_data.username:
        existing_username = await user_crud.get_user_by_username(db, user_data.username)
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create user
    user = await user_crud.create_user(db, user_data)
    return user


@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password."""
    user = await user_crud.authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token."""
    payload = decode_token(token_data.refresh_token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = payload.get("sub")
    user = await user_crud.get_user(db, int(user_id))
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or disabled"
        )
    
    # Generate new tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    return current_user


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user profile with stats."""
    from sqlalchemy import select, func
    from app.models.paper import Paper
    from app.models.podcast import Podcast
    from app.models.note import Note, ChatMessage

    # Count papers
    papers_result = await db.execute(select(func.count(Paper.id)).where(Paper.user_id == current_user.id))
    papers_count = papers_result.scalar() or 0
    
    # Count podcasts
    podcasts_result = await db.execute(select(func.count(Podcast.id)).where(Podcast.user_id == current_user.id))
    podcasts_count = podcasts_result.scalar() or 0
    
    # Count notes
    notes_result = await db.execute(select(func.count(Note.id)).where(Note.user_id == current_user.id))
    notes_count = notes_result.scalar() or 0
    
    # Count questions (chat messages from user)
    questions_result = await db.execute(
        select(func.count(ChatMessage.id))
        .where(ChatMessage.user_id == current_user.id, ChatMessage.role == "user")
    )
    questions_count = questions_result.scalar() or 0

    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        avatar_url=current_user.avatar_url,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        papers_count=papers_count,
        podcasts_count=podcasts_count,
        notes_count=notes_count,
        questions_asked=questions_count
    )


@router.post("/logout", response_model=MessageResponse)
async def logout():
    """Logout (client should discard tokens)."""
    # In a more sophisticated implementation, you might blacklist the token
    return MessageResponse(message="Successfully logged out")


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change password."""
    from app.core.security import verify_password, get_password_hash
    
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.hashed_password = get_password_hash(new_password)
    await db.commit()
    
    return MessageResponse(message="Password changed successfully")

