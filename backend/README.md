# VoxScholar AI Backend

FastAPI backend for the VoxScholar AI research paper analysis platform.

## Tech Stack

- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL / SQLite
- **Authentication**: JWT
- **AI Services**: OpenAI GPT-4, ElevenLabs TTS
- **PDF Processing**: PyMuPDF

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL or SQLite connection string
- `SECRET_KEY` - JWT secret key
- `OPENAI_API_KEY` - OpenAI API key
- `ELEVENLABS_API_KEY` - ElevenLabs API key

### 4. Run the Server

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Or use the startup script
bash run.sh
```

The API will be available at `http://localhost:8000`
API documentation: `http://localhost:8000/docs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Papers
- `POST /api/papers/upload` - Upload PDF paper
- `GET /api/papers` - List user papers
- `GET /api/papers/{id}` - Get paper details
- `POST /api/papers/{id}/process` - Process paper with AI
- `DELETE /api/papers/{id}` - Delete paper

### Podcasts
- `POST /api/podcasts/generate` - Generate podcast from paper
- `GET /api/podcasts` - List podcasts
- `GET /api/podcasts/{id}` - Get podcast details
- `GET /api/podcasts/{id}/audio` - Get podcast audio

### Notes & Chat
- `POST /api/notes` - Create note
- `GET /api/notes` - List notes
- `POST /api/chat` - Chat with AI about a paper
- `POST /api/notes/generate` - Generate study notes

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

## Project Structure

```
backend/
├── app/
│   ├── api/           # API routes
│   ├── core/          # Config, database, security
│   ├── crud/          # Database operations
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   └── services/      # Business logic & external APIs
├── requirements.txt
├── run.sh
└── .env.example
```

## Features

- User authentication with JWT
- PDF upload and text extraction
- AI-powered paper analysis (summary, topics, findings)
- Text-to-speech podcast generation
- Interactive Q&A with RAG
- Research notes management

## License

MIT

