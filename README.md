# 🎙️ VoxScholar AI

> **An AI-powered research platform that transforms academic papers into interactive audio podcasts and enables intelligent Q&A with your documents.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [How to Run](#how-to-run)
- [API Overview](#api-overview)

---

## Overview

VoxScholar AI allows researchers, students, and academics to:
- Upload PDF research papers
- Automatically generate AI-narrated audio podcasts from those papers
- Ask questions and get intelligent answers grounded in the paper content (RAG-based Q&A)
- Manage research notes with a rich-text editor
- Authenticate securely with JWT-based login

---

## Features

| Feature | Description |
|---|---|
| 📄 PDF Upload & Analysis | Upload research papers (up to 50 MB); text is extracted and indexed |
| 🎧 Podcast Generation | Convert papers to host/guest style audio podcasts using ElevenLabs TTS |
| 🤖 AI Chat (RAG) | Ask questions; AI answers using FAISS vector search over the paper's content |
| 📝 Research Notes | Rich-text note editor with export to PDF |
| 🔐 Authentication | JWT-based login/signup with secure refresh tokens |
| ☁️ Cloud Storage | Optional Cloudinary integration for uploaded PDF assets |

---

## Project Structure

```
vox-scholar-ai/
├── frontend/               # React + TypeScript + Tailwind CSS (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components (shadcn/ui based)
│   │   ├── pages/          # Route-level page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities, API clients, helpers
│   │   └── main.tsx        # App entry point
│   ├── public/             # Static assets
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example        # Frontend environment variables template
│
└── backend/                # FastAPI Python backend
    ├── app/
    │   ├── main.py         # FastAPI application entry point
    │   ├── routes/         # API route handlers
    │   ├── models/         # SQLAlchemy DB models
    │   ├── services/       # Business logic (AI, podcast, auth, etc.)
    │   └── schemas/        # Pydantic request/response schemas
    ├── models/             # AI/ML model files (FAISS indexes, etc.)
    ├── uploads/            # Local file uploads directory
    ├── requirements.txt    # Python dependencies
    ├── run.sh              # Convenience startup script
    └── .env.example        # Backend environment variables template
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | Core UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS + shadcn/ui | Styling & component library |
| Framer Motion | Animations |
| React Router v6 | Client-side routing |
| TanStack Query | Server state & data fetching |
| React Hook Form + Zod | Form validation |
| Axios | HTTP client |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | Web framework & REST API |
| SQLAlchemy + Alembic | ORM & database migrations |
| Supabase / PostgreSQL | Primary database |
| OpenAI GPT-4 / Groq | AI text generation & analysis |
| ElevenLabs TTS | Text-to-speech podcast generation |
| Edge TTS | Fallback TTS option |
| PyMuPDF | PDF text extraction |
| FAISS + NumPy | Vector similarity search (RAG) |
| python-jose + passlib | JWT authentication & password hashing |
| Cloudinary | Optional cloud file storage |

---

## Prerequisites

Make sure the following are installed on your system:

### For the Backend
- **Python 3.10+** — [Download](https://www.python.org/downloads/)
- **pip** (comes with Python)
- **PostgreSQL** (or use Supabase cloud) — [Download](https://www.postgresql.org/download/)

### For the Frontend
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

### Required API Keys
You will need accounts and API keys for:
| Service | Required | Purpose | Get Key |
|---|---|---|---|
| OpenAI | ✅ Yes | AI analysis & podcast script writing | [platform.openai.com](https://platform.openai.com) |
| ElevenLabs | ✅ Yes | Text-to-speech audio generation | [elevenlabs.io](https://elevenlabs.io) |
| Supabase | ✅ Yes | Database (or use local PostgreSQL) | [supabase.com](https://supabase.com) |
| Groq | ⬜ Optional | Faster LLM inference alternative | [console.groq.com](https://console.groq.com) |
| Cloudinary | ⬜ Optional | Cloud file storage for PDFs | [cloudinary.com](https://cloudinary.com) |

---

## Environment Variables

### Backend — `backend/.env`

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
# Server
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voxscholar
# Or use Supabase connection string

# JWT Authentication
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4

# ElevenLabs (Text-to-Speech)
ELEVENLABS_API_KEY=your-elevenlabs-api-key
VOICE_ID_MALE=21m00Tcm4TlvDq8ikWAM
VOICE_ID_FEMALE=2EiwWnGeFN0m4CMYp7k9

# CORS — must match your frontend URL
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# File Uploads
MAX_UPLOAD_SIZE=52428800   # 50 MB in bytes
UPLOAD_DIR=./uploads

# Cloudinary (Optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend — `frontend/.env`

Copy `frontend/.env.example` to `frontend/.env` and fill in:

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## How to Run

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/vox-scholar-ai.git
cd vox-scholar-ai
```

---

### 2. Start the Backend

```bash
# Navigate to the backend folder
cd backend

# Create and activate a Python virtual environment
python -m venv venv
source venv/bin/activate        # macOS / Linux
# OR on Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# ✏️  Open .env and add your API keys

# Run database migrations (first time only)
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be running at: **http://localhost:8000**  
Interactive API docs available at: **http://localhost:8000/docs**

---

### 3. Start the Frontend

Open a **new terminal tab/window**, then:

```bash
# Navigate to the frontend folder
cd frontend

# Install Node.js dependencies
npm install

# Set up environment variables
cp .env.example .env
# ✏️  Open .env and set VITE_API_BASE_URL=http://localhost:8000

# Start the development server
npm run dev
```

The frontend will be running at: **http://localhost:5173**

---

### 4. Open the App

Open your browser and go to: **[http://localhost:5173](http://localhost:5173)**

- Sign up for a new account
- Upload a PDF research paper
- Generate a podcast or start chatting with the AI!

---

## API Overview

The backend exposes the following main API route groups:

| Route Prefix | Description |
|---|---|
| `POST /auth/signup` | Register a new user |
| `POST /auth/login` | Login and receive JWT tokens |
| `POST /papers/upload` | Upload a PDF paper |
| `GET /papers/` | List all uploaded papers |
| `POST /papers/{id}/podcast` | Generate a podcast from a paper |
| `POST /papers/{id}/chat` | Ask a question about a paper (RAG) |
| `GET /notes/` | List research notes |
| `POST /notes/` | Create a new research note |

Full interactive documentation: **http://localhost:8000/docs**

---

## Common Issues

**`ModuleNotFoundError` on backend start**  
→ Make sure your virtual environment is activated: `source venv/bin/activate`

**Database connection errors**  
→ Check your `DATABASE_URL` in `backend/.env` and ensure PostgreSQL is running

**CORS errors in browser**  
→ Make sure `CORS_ORIGINS` in `backend/.env` includes your frontend URL (e.g., `http://localhost:5173`)

**ElevenLabs quota exceeded**  
→ The backend will automatically fall back to Edge TTS for audio generation

---

*Built with ❤️ using FastAPI, React, and OpenAI*
