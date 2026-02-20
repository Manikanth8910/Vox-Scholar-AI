# VoxScholar AI

Research Paper Analysis Platform - Convert research papers to podcasts and interact with AI

## Project Structure

```
vox-scholar-ai/
├── frontend/          # React + TypeScript + Tailwind CSS
│   ├── src/          # React components and pages
│   ├── public/       # Static assets
│   └── ...
│
└── backend/          # FastAPI Python backend
    ├── app/         # API routes, models, services
    ├── requirements.txt
    └── ...
```

## Getting Started

### Frontend (React)

```
bash
cd frontend
npm install
npm run dev
```

### Backend (FastAPI)

```
bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # Configure your API keys
uvicorn app.main:app --reload
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **AI**: OpenAI GPT-4, ElevenLabs TTS
- **PDF Processing**: PyMuPDF

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/voxscholar
SECRET_KEY=your-secret-key
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
```

## Features

- PDF paper upload and AI analysis
- Convert papers to audio podcasts
- Interactive Q&A with AI
- Research notes management
- User authentication
