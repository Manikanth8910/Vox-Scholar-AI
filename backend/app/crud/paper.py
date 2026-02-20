from typing import Optional, List
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.paper import Paper
from app.schemas.paper import PaperCreate, PaperUpdate
import hashlib


async def get_paper(db: AsyncSession, paper_id: int) -> Optional[Paper]:
    """Get paper by ID."""
    result = await db.execute(
        select(Paper).where(Paper.id == paper_id)
    )
    return result.scalar_one_or_none()


async def get_paper_by_filename(db: AsyncSession, filename: str, user_id: int) -> Optional[Paper]:
    """Get paper by filename for a specific user."""
    result = await db.execute(
        select(Paper).where(
            Paper.filename == filename,
            Paper.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def create_paper(db: AsyncSession, user_id: int, paper_data: PaperCreate) -> Paper:
    """Create a new paper record."""
    db_paper = Paper(
        user_id=user_id,
        title=paper_data.title,
        filename=paper_data.filename,
        file_path=paper_data.file_path,
        file_size=paper_data.file_size,
        mime_type=paper_data.mime_type,
        authors=paper_data.authors,
        publication_year=paper_data.publication_year,
        journal=paper_data.journal,
        doi=paper_data.doi,
    )
    
    db.add(db_paper)
    await db.commit()
    await db.refresh(db_paper)
    return db_paper


async def update_paper(db: AsyncSession, paper: Paper, paper_data: PaperUpdate) -> Paper:
    """Update paper information."""
    update_data = paper_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(paper, field, value)
    
    await db.commit()
    await db.refresh(paper)
    return paper


async def delete_paper(db: AsyncSession, paper_id: int) -> bool:
    """Delete a paper."""
    paper = await get_paper(db, paper_id)
    if paper:
        await db.delete(paper)
        await db.commit()
        return True
    return False


async def list_user_papers(
    db: AsyncSession, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 50,
    processed_only: bool = False
) -> List[Paper]:
    """List all papers for a user."""
    query = select(Paper).where(Paper.user_id == user_id).order_by(desc(Paper.created_at))
    
    if processed_only:
        query = query.where(Paper.is_processed == True)
    
    result = await db.execute(
        query.offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def count_user_papers(db: AsyncSession, user_id: int) -> int:
    """Count total papers for a user."""
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(Paper.id)).where(Paper.user_id == user_id)
    )
    return result.scalar() or 0


async def search_papers(
    db: AsyncSession,
    user_id: int,
    query: str,
    skip: int = 0,
    limit: int = 20
) -> List[Paper]:
    """Search papers by title or content."""
    search_pattern = f"%{query}%"
    result = await db.execute(
        select(Paper)
        .where(Paper.user_id == user_id)
        .where(Paper.title.ilike(search_pattern) | Paper.summary.ilike(search_pattern))
        .order_by(desc(Paper.created_at))
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_related_papers(
    db: AsyncSession,
    user_id: int,
    paper_id: int,
    limit: int = 5
) -> List[Paper]:
    """Get related papers based on topics."""
    paper = await get_paper(db, paper_id)
    if not paper or not paper.topics:
        return []
    
    # Simple similarity based on shared topics
    # In production, you'd use vector similarity search
    result = await db.execute(
        select(Paper)
        .where(Paper.user_id == user_id)
        .where(Paper.id != paper_id)
        .order_by(desc(Paper.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())


async def update_reading_progress(
    db: AsyncSession,
    paper_id: int,
    progress: int
) -> Optional[Paper]:
    """Update reading progress (0-100)."""
    paper = await get_paper(db, paper_id)
    if paper:
        paper.reading_progress = max(0, min(100, progress))
        await db.commit()
        await db.refresh(paper)
    return paper

