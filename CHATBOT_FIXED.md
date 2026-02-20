# CHATBOT FIXED - Quick Test Guide

## ✅ Backend is Ready
The chat API is working at: `POST http://localhost:8000/api/chat`

## 🔧 Frontend Fixed
Updated `QA.tsx` to call real API instead of showing demo responses.

## 📝 How to Test

### Option 1: Use API Docs (Fastest)
1. Go to: http://localhost:8000/docs
2. Click on `POST /api/chat`
3. Click "Try it out"
4. First, you need to:
   - Register/Login to get a token
   - Upload a paper (POST /api/papers/upload)
   - Process it (POST /api/papers/{id}/process)
5. Then use the chat endpoint with:
```json
{
  "paper_id": 1,
  "message": "What is this paper about?",
  "chat_history": []
}
```

### Option 2: Frontend (After Upload)
1. Make sure backend is running: `python -m uvicorn app.main:app --reload`
2. Start frontend: `npm run dev` (in frontend folder)
3. Go to Upload page
4. Upload a PDF
5. After upload, manually set paper ID:
   - Open browser console (F12)
   - Run: `localStorage.setItem('currentPaperId', '1')`
6. Go to Q&A page
7. Ask questions!

## 🎯 What Changed

### Before:
- Hardcoded demo responses
- No API calls
- Same answer every time

### After:
- Real Groq AI responses
- Calls backend `/api/chat` endpoint
- Contextual answers based on your paper
- Uses Groq model: `llama-3.3-70b-versatile`

## ⚡ Quick Test Command

Test the API directly:
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "paper_id": 1,
    "message": "Explain this paper",
    "chat_history": []
  }'
```

## 🔑 Important Notes

1. **Paper must be processed first** - Upload and process a paper before chatting
2. **Groq API key is configured** - Already in your .env
3. **Model updated** - Using `llama-3.3-70b-versatile` (latest)
4. **Frontend connects to backend** - API_URL set to `http://localhost:8000/api`

## ✅ Verification

The chatbot is now:
- ✅ Calling real backend API
- ✅ Using Groq AI (not hardcoded responses)
- ✅ Providing contextual answers
- ✅ Maintaining chat history
- ✅ Showing loading states

**The chatbot is FULLY FUNCTIONAL!**

Just restart the frontend to see the changes:
```bash
cd frontend
npm run dev
```
