import os
import aiofiles
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.crud import paper as paper_crud
from app.schemas import (
    PaperResponse,
    PaperDetail,
    PaperCreate,
    PaperUpdate,
    PaperUploadResponse,
    PaperProcessingStatus,
    MessageResponse,
)
from app.models.user import User
from app.services import pdf_service, openai_service

router = APIRouter(prefix="/papers", tags=["Papers"])


@router.post("/upload", response_model=PaperUploadResponse)
async def upload_paper(
    file: UploadFile = File(...),
    title: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a research paper (PDF)."""
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
    
    # Check file size
    file_content = await file.read()
    if len(file_content) > settings.max_upload_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds {settings.max_upload_size / 1024 / 1024}MB limit"
        )
    
    # Save file
    file_path = pdf_service.save_uploaded_file(file_content, file.filename, current_user.id)
    
    # Create paper record
    paper_data = PaperCreate(
        title=title,
        filename=file.filename,
        file_path=file_path,
        file_size=len(file_content),
        mime_type="application/pdf"
    )
    
    paper = await paper_crud.create_paper(db, current_user.id, paper_data)
    
    return PaperUploadResponse(
        paper_id=paper.id,
        title=paper.title,
        message="Paper uploaded successfully. Processing will begin shortly."
    )


@router.get("", response_model=List[PaperResponse])
async def list_papers(
    skip: int = 0,
    limit: int = 50,
    processed_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all papers for the current user."""
    papers = await paper_crud.list_user_papers(
        db, current_user.id, skip, limit, processed_only
    )
    return papers


@router.get("/{paper_id}", response_model=PaperDetail)
async def get_paper(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get paper details."""
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
    
    return paper


@router.put("/{paper_id}", response_model=PaperResponse)
async def update_paper(
    paper_id: int,
    paper_data: PaperUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update paper details."""
    paper = await paper_crud.get_paper(db, paper_id)
    
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    if paper.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this paper"
        )
    
    paper = await paper_crud.update_paper(db, paper, paper_data)
    return paper


@router.delete("/{paper_id}", response_model=MessageResponse)
async def delete_paper(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a paper."""
    paper = await paper_crud.get_paper(db, paper_id)
    
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    if paper.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this paper"
        )
    
    # Delete file
    pdf_service.delete_file(paper.file_path)
    
    # Delete from database
    await paper_crud.delete_paper(db, paper_id)
    
    return MessageResponse(message="Paper deleted successfully")

async def run_processing(paper_id: int, user_id: int, db_session_factory):
    """Background task for processing paper."""
    from app.core.database import SessionLocal
    async with SessionLocal() as db:
        paper = await paper_crud.get_paper(db, paper_id)
        if not paper:
            return

        try:
            print(f"DEBUG: [Background] Starting processing for paper {paper_id}")
            
            # 1. Extract text from PDF
            print(f"DEBUG: [Background] Extracting text")
            raw_text = await pdf_service.extract_text(paper.file_path)
            paper.raw_text = raw_text
            await db.commit()
            
            # 2. AI Analysis (Concurrent Execution for speed)
            print("DEBUG: [Background] Generating AI insights concurrently...")
            summary, topics, key_findings, methodology = await asyncio.gather(
                openai_service.generate_summary(raw_text),
                openai_service.extract_topics(raw_text),
                openai_service.extract_key_findings(raw_text),
                openai_service.generate_methodology(raw_text)
            )
            
            paper.summary = summary
            paper.topics = topics
            paper.key_findings = key_findings
            paper.methodology = methodology
            
            # Mark as processed
            paper.is_processed = True
            paper.processing_status = "completed"
            
            await db.commit()
            print(f"DEBUG: [Background] Processing complete for paper {paper_id}")
            
        except Exception as e:
            print(f"DEBUG: [Background] Error processing paper {paper_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            paper.processing_status = "failed"
            paper.processing_error = str(e)
            await db.commit()

@router.post("/{paper_id}/process", response_model=PaperProcessingStatus)
async def process_paper(
    paper_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Start paper processing in the background."""
    paper = await paper_crud.get_paper(db, paper_id)
    
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    if paper.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to process this paper"
        )
    
    if paper.processing_status == "processing":
        return PaperProcessingStatus(
            paper_id=paper.id,
            status="processing",
            progress=50,
            message="Already processing"
        )

    # Reset/Set status to processing
    paper.processing_status = "processing"
    paper.processing_error = None
    await db.commit()

    # Add background task
    background_tasks.add_task(run_processing, paper_id, current_user.id, None)
    
    return PaperProcessingStatus(
        paper_id=paper.id,
        status="processing",
        progress=10,
        message="Processing started in background"
    )


@router.get("/{paper_id}/status", response_model=PaperProcessingStatus)
async def get_processing_status(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get paper processing status."""
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
    
    progress = 0
    if paper.processing_status == "completed":
        progress = 100
    elif paper.processing_status == "processing":
        progress = 50
    
    return PaperProcessingStatus(
        paper_id=paper.id,
        status=paper.processing_status,
        progress=progress,
        message=paper.processing_error
    )


@router.get("/{paper_id}/related", response_model=List[PaperResponse])
async def get_related_papers(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get related papers."""
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
    
    related = await paper_crud.get_related_papers(db, current_user.id, paper_id)
    return related


@router.post("/{paper_id}/progress", response_model=PaperResponse)
async def update_reading_progress(
    paper_id: int,
    progress: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update reading progress."""
    paper = await paper_crud.get_paper(db, paper_id)
    
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paper not found"
        )
    
    if paper.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this paper"
        )
    
    paper = await paper_crud.update_reading_progress(db, paper_id, progress)
    return paper


@router.get("/{paper_id}/flowchart")
async def get_paper_flowchart(
    paper_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate a React Flow / Mermaid compatible flowchart JSON from paper."""
    paper = await paper_crud.get_paper(db, paper_id)
    if not paper or paper.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    if not paper.is_processed:
        raise HTTPException(status_code=400, detail="Paper not processed")
        
    flowchart_nodes = await openai_service.generate_flowchart(paper.raw_text or paper.summary or "")
    return {"nodes": flowchart_nodes, "paper_title": paper.title}

