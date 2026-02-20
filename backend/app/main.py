"""
VoxScholar AI Backend - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    print("Starting VoxScholar AI Backend...")
    await init_db()
    yield
    # Shutdown
    print("Shutting down VoxScholar AI Backend...")


# Create FastAPI app
app = FastAPI(
    title="VoxScholar AI API",
    description="""
    Backend API for VoxScholar AI - Research Paper Analysis Platform
    
    Features:
    - User authentication with JWT
    - PDF paper upload and processing
    - AI-powered paper analysis (summarization, topic extraction)
    - Podcast generation with text-to-speech
    - Interactive Q&A with RAG
    - Research notes management
    """,
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "VoxScholar AI API",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to VoxScholar AI API",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )

