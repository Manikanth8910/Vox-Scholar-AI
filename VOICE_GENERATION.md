# Voice/Podcast Generation - Quick Fix

## Issue
The podcast page shows demo data. Voice generation requires:
1. ElevenLabs API key
2. Backend API call to generate podcast
3. Frontend to fetch and play the audio

## Quick Solution

### Option 1: Get ElevenLabs API Key (For Real Voice)
1. Go to: https://elevenlabs.io/
2. Sign up (FREE - 10,000 characters/month)
3. Go to Profile → API Keys
4. Copy your API key
5. Add to `backend/.env`:
```env
ELEVENLABS_API_KEY=your-key-here
```

### Option 2: Test Without Voice (Text Only)
The chatbot works without ElevenLabs. Just skip podcast generation for now.

## How Podcast Generation Works

1. **Upload Paper** → Backend extracts text
2. **Process Paper** → GPT-4 generates summary
3. **Generate Podcast** → 
   - GPT-4 creates dialogue script
   - ElevenLabs converts to audio (2 voices)
   - Saves MP3 file
4. **Play** → Frontend streams the audio

## Test Podcast Generation

### Via API Docs:
1. Go to: http://localhost:8000/docs
2. Find `POST /api/podcasts/generate`
3. Click "Try it out"
4. Enter:
```json
{
  "paper_id": 1,
  "style": "educational",
  "speed": 1.0
}
```
5. Execute

### Response:
```json
{
  "podcast_id": 1,
  "status": "completed",
  "audio_url": "/api/podcasts/1/audio"
}
```

## Current Status

✅ **Working:**
- Chat Q&A (uses Groq - FREE)
- PDF upload
- Text extraction
- Paper processing

❌ **Needs ElevenLabs Key:**
- Voice generation
- Podcast audio

## Priority

Since you need this urgently:
1. **Focus on Q&A chatbot** ✅ (Already working!)
2. **Skip podcast for now** (Requires paid API)

The chatbot is fully functional and doesn't need ElevenLabs!

## Quick Test Chatbot (No Voice Needed)

1. Backend running: ✅
2. Frontend: Restart with `npm run dev`
3. Go to Q&A page
4. Set paper ID in console: `localStorage.setItem('currentPaperId', '1')`
5. Ask questions → Get AI responses!

**The chatbot works perfectly without any voice API!**
