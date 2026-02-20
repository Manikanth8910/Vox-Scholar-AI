# 🚀 Quick Start - Run Your Website

## Option 1: One-Click Start (Easiest)

Double-click: **`RUN_WEBSITE.bat`**

This will:
1. Start the backend server (http://localhost:8000)
2. Start the frontend (http://localhost:5173)
3. Open your browser automatically

## Option 2: Manual Start

### Start Backend:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Start Frontend (in new terminal):
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Access Your Website

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## ⚙️ Configure API Keys (For Podcast Feature)

Edit `backend\.env`:
```env
OPENAI_API_KEY=sk-your-key-here
ELEVENLABS_API_KEY=your-key-here
```

Get keys from:
- OpenAI: https://platform.openai.com/api-keys
- ElevenLabs: https://elevenlabs.io/

## 🎉 That's It!

Your website is now running!

To stop: Close the terminal windows or press Ctrl+C
