from fastapi import APIRouter
from pydantic import BaseModel
from app.services import openai_service

router = APIRouter(prefix="/test", tags=["Test"])

class TestChatRequest(BaseModel):
    message: str

class TestChatResponse(BaseModel):
    message: str

@router.post("/chat", response_model=TestChatResponse)
async def test_chat(request: TestChatRequest):
    """Test chat endpoint without authentication."""
    try:
        # Use Groq to respond
        response, _ = await openai_service.chat(
            message=request.message,
            context="This is a test. You are VoxScholar AI assistant.",
            chat_history=[]
        )
        return TestChatResponse(message=response)
    except Exception as e:
        return TestChatResponse(message=f"Test response: I received your message '{request.message}'. Error: {str(e)}")
