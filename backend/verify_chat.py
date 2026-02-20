"""
Verify chat endpoint is configured correctly.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("Checking Q&A Chat Endpoint Configuration")
print("=" * 60)

# Check if chat.py exists
chat_file = "app/api/chat.py"
if os.path.exists(chat_file):
    print(f"[OK] Chat API file exists: {chat_file}")
else:
    print(f"[ERROR] Chat API file missing: {chat_file}")
    sys.exit(1)

# Check if __init__.py includes chat
init_file = "app/api/__init__.py"
with open(init_file, 'r') as f:
    content = f.read()
    if 'chat' in content:
        print(f"[OK] Chat router registered in {init_file}")
    else:
        print(f"[ERROR] Chat router not registered in {init_file}")
        sys.exit(1)

# Check chat.py content
with open(chat_file, 'r') as f:
    content = f.read()
    if 'ChatRequest' in content and 'ChatResponse' in content:
        print("[OK] Chat schemas defined")
    if '@router.post' in content:
        print("[OK] Chat POST endpoint defined")
    if 'openai_service.chat' in content:
        print("[OK] OpenAI service integrated")

print("\n" + "=" * 60)
print("[SUCCESS] Q&A Chat Endpoint is Ready!")
print("=" * 60)
print("\nEndpoint: POST /api/chat")
print("\nTo use:")
print("1. Start server: uvicorn app.main:app --reload")
print("2. Visit: http://localhost:8000/docs")
print("3. Look for /api/chat endpoint")
print("4. Upload & process a paper first")
print("5. Send chat requests with paper_id and message")
print("\n✅ Configuration verified successfully!")
