"""
ElevenLabs service for text-to-speech podcast generation.
"""
import io
from typing import List, Dict, Any, Optional
import asyncio
from elevenlabs.client import AsyncElevenLabs

from app.core.config import settings


class ElevenLabsService:
    """Service for ElevenLabs TTS API interactions."""
    
    def __init__(self):
        self.client = AsyncElevenLabs(api_key=settings.elevenlabs_api_key)
        self.default_male_voice = settings.voice_id_male
        self.default_female_voice = settings.voice_id_female
    
    async def generate_speech(
        self,
        text: str,
        voice_id: str,
        stability: float = 0.5,
        similarity_boost: float = 0.8,
        style: float = 0.3,
        speed: float = 1.0
    ) -> bytes:
        """Generate speech from text."""
        audio = await self.client.generate(
            text=text,
            voice=voice_id,
            model="eleven_multilingual_v2",
            stability=stability,
            similarity_boost=similarity_boost,
            style=style,
            speed=speed
        )
        
        # Convert generator to bytes
        audio_bytes = b"".join([chunk for chunk in audio])
        return audio_bytes
    
    async def generate_podcast_audio(
        self,
        script: List[Dict[str, Any]],
        voice_male: Optional[str] = None,
        voice_female: Optional[str] = None,
        speed: float = 1.0
    ) -> tuple[bytes, float]:
        """Generate podcast audio from script."""
        
        voice_male = voice_male or self.default_male_voice
        voice_female = voice_female or self.default_female_voice
        
        audio_segments = []
        total_duration = 0.0
        
        for entry in script:
            speaker = entry.get("speaker", "A")
            text = entry.get("text", "")
            name = entry.get("speaker_name", "Speaker")
            
            # Skip recap entries (they'll be handled differently)
            if entry.get("is_recap", False):
                continue
            
            # Select voice based on speaker
            voice_id = voice_male if speaker == "A" else voice_female
            
            if text:
                try:
                    audio = await self.generate_speech(
                        text=text,
                        voice_id=voice_id,
                        speed=speed
                    )
                    audio_segments.append(audio)
                    
                    # Estimate duration (rough estimate: 150 words per minute at 1x speed)
                    word_count = len(text.split())
                    duration = (word_count / 150) / speed
                    total_duration += duration
                    
                    # Small pause between segments
                    pause_duration = int(0.5 * 44100 * 2)  # 0.5 seconds of silence
                    audio_segments.append(b'\x00' * pause_duration)
                    
                except Exception as e:
                    print(f"Error generating audio for {name}: {e}")
                    continue
        
        # Combine all audio segments
        final_audio = b"".join(audio_segments)
        return final_audio, total_duration
    
    async def generate_recap_audio(
        self,
        text: str,
        voice_id: Optional[str] = None
    ) -> bytes:
        """Generate audio for recap sections."""
        voice_id = voice_id or self.default_female_voice
        
        return await self.generate_speech(
            text=text,
            voice_id=voice_id,
            stability=0.3,
            style=0.5
        )
    
    def get_available_voices(self) -> List[Dict[str, str]]:
        """Get list of available voices."""
        # In production, fetch from API
        return [
            {"id": self.default_male_voice, "name": "Male Voice"},
            {"id": self.default_female_voice, "name": "Female Voice"},
        ]


# Singleton instance
elevenlabs_service = ElevenLabsService()

