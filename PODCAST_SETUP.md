# Podcast Generation Setup Guide

## Overview
The podcast generation feature converts research papers into audio podcasts using:
1. **PDF Upload** → Extract text from research paper
2. **Text Extraction** → Clean and process paper content
3. **LLM (GPT-4)** → Generate engaging dialogue script
4. **TTS (ElevenLabs)** → Convert script to audio with multiple voices
5. **Storage** → Save MP3 locally or upload to Cloudinary
6. **Podcast Player** → Stream audio in frontend

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure API Keys

Edit your `.env` file:

```env
# Required for podcast generation
OPENAI_API_KEY=sk-your-openai-api-key-here
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here

# Optional: For cloud storage (otherwise uses local storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Voice IDs (default voices provided, or use your own)
VOICE_ID_MALE=21m00Tcm4TlvDq8ikWAM
VOICE_ID_FEMALE=2EiwWnGeFN0m4CMYp7k9
```

### 3. Get API Keys

#### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy and paste into `.env`

#### ElevenLabs API Key
1. Go to https://elevenlabs.io/
2. Sign up for free account (10,000 characters/month free)
3. Go to Profile → API Keys
4. Copy your API key to `.env`

#### Cloudinary (Optional)
1. Go to https://cloudinary.com/
2. Sign up for free account
3. Get credentials from Dashboard
4. Add to `.env` (if not provided, uses local storage)

### 4. Run the Server

```bash
uvicorn app.main:app --reload
```

## API Usage

### Generate Podcast

```bash
POST /api/podcasts/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "paper_id": 1,
  "style": "educational",  // Options: educational, debate, beginner, exam, research
  "speed": 1.0,            // 0.5 to 2.0
  "voice_male": "21m00Tcm4TlvDq8ikWAM",    // Optional
  "voice_female": "2EiwWnGeFN0m4CMYp7k9"   // Optional
}
```

### Response

```json
{
  "podcast_id": 1,
  "status": "completed",
  "progress": 100,
  "audio_url": "/api/podcasts/1/audio",
  "message": "Podcast generated successfully"
}
```

### Get Podcast Audio

```bash
GET /api/podcasts/{podcast_id}/audio
Authorization: Bearer <token>
```

Returns MP3 audio file.

## Podcast Styles

1. **educational** (default) - Clear, structured explanation
2. **debate** - Two speakers debate the paper's merits
3. **beginner** - Simple language with analogies
4. **exam** - Focus on memorization and key points
5. **research** - Deep technical analysis

## Architecture

```
┌─────────────┐
│ Upload PDF  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Extract Text    │ (PyMuPDF)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Generate Script │ (OpenAI GPT-4)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Text-to-Speech  │ (ElevenLabs)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Upload Storage  │ (Cloudinary/Local)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Podcast Player  │
└─────────────────┘
```

## File Structure

```
backend/
├── app/
│   ├── api/
│   │   └── podcasts.py          # Podcast API endpoints
│   ├── services/
│   │   ├── pdf_service.py       # PDF text extraction
│   │   ├── openai_service.py    # Script generation
│   │   ├── elevenlabs_service.py # Audio generation
│   │   └── storage_service.py   # File storage
│   ├── models/
│   │   └── podcast.py           # Database models
│   └── schemas/
│       └── podcast.py           # API schemas
└── uploads/
    └── podcasts/                # Generated audio files
```

## Troubleshooting

### Issue: "Failed to generate podcast script"
- Check OpenAI API key is valid
- Ensure paper is processed (has summary and key_findings)
- Check API quota/billing

### Issue: "Error generating audio"
- Verify ElevenLabs API key
- Check character limit (free tier: 10k chars/month)
- Ensure voice IDs are valid

### Issue: "Audio file not found"
- Check UPLOAD_DIR exists and is writable
- Verify storage service is working
- Check file permissions

### Issue: Cloudinary upload fails
- Verify credentials in .env
- Check cloudinary package is installed
- Falls back to local storage automatically

## Cost Estimates

### OpenAI (GPT-4)
- ~$0.03 per podcast (3000 tokens)
- Script generation only

### ElevenLabs
- Free tier: 10,000 characters/month
- Paid: $5/month for 30,000 characters
- Average podcast: ~2000-3000 characters

### Cloudinary (Optional)
- Free tier: 25GB storage, 25GB bandwidth
- More than enough for most use cases

## Testing

```bash
# 1. Upload a paper
curl -X POST http://localhost:8000/api/papers/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@paper.pdf"

# 2. Process the paper
curl -X POST http://localhost:8000/api/papers/1/process \
  -H "Authorization: Bearer <token>"

# 3. Generate podcast
curl -X POST http://localhost:8000/api/podcasts/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"paper_id": 1, "style": "educational"}'

# 4. Download audio
curl -X GET http://localhost:8000/api/podcasts/1/audio \
  -H "Authorization: Bearer <token>" \
  -o podcast.mp3
```

## Next Steps

1. ✅ Backend implementation complete
2. 🔄 Frontend integration needed:
   - Podcast generation UI
   - Audio player component
   - Progress tracking
   - Transcript display
3. 🔄 Optional enhancements:
   - Background job queue (Celery)
   - Webhook notifications
   - Multiple language support
   - Custom voice cloning

## Support

For issues or questions:
- Check API logs: `uvicorn app.main:app --reload --log-level debug`
- Review error messages in response
- Verify all API keys are valid
- Check service status (OpenAI, ElevenLabs)
