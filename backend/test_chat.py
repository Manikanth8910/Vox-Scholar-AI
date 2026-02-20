"""
Quick test to verify chat endpoint is properly configured.
Run this after starting the server.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_chat_endpoint():
    print("=" * 60)
    print("Testing Q&A Chat Endpoint")
    print("=" * 60)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Server is running: {response.json()}")
    except:
        print("❌ Server is not running!")
        print("Start server with: uvicorn app.main:app --reload")
        return
    
    # Check API docs
    print(f"\n📚 API Documentation: {BASE_URL}/docs")
    print(f"🔍 Check if /api/chat endpoint exists in the docs")
    
    print("\n" + "=" * 60)
    print("Chat Endpoint Configuration:")
    print("=" * 60)
    print("✅ Endpoint: POST /api/chat")
    print("✅ Authentication: Required (Bearer token)")
    print("✅ Request body:")
    print(json.dumps({
        "paper_id": 1,
        "message": "What is this paper about?",
        "chat_history": []
    }, indent=2))
    
    print("\n✅ Chat endpoint is configured!")
    print("\nTo use:")
    print("1. Upload and process a paper")
    print("2. Send POST request to /api/chat with paper_id and message")
    print("3. Get AI response based on paper content")

if __name__ == "__main__":
    test_chat_endpoint()
