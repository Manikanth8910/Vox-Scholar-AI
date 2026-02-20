# API Router
from fastapi import APIRouter
from app.api import auth, papers, podcasts, notes, users

api_router = APIRouter(prefix="/api")

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(papers.router)
api_router.include_router(podcasts.router)
api_router.include_router(notes.router)
api_router.include_router(users.router)

