"""
TTS service using Microsoft Edge TTS (free, no API key required).
Produces high-quality MP3 audio for podcast generation.
"""
import asyncio
import os
import tempfile
from typing import List, Dict, Any, Optional
import edge_tts

from app.core.config import settings


# High-quality Edge TTS voices
VOICE_A = "en-US-AndrewMultilingualNeural"   # Male — deep, professional
VOICE_B = "en-US-AvaMultilingualNeural"       # Female — warm, clear


class ElevenLabsService:
    """TTS service wrapping Edge TTS (Microsoft, free)."""

    def __init__(self):
        self.default_male_voice = VOICE_A
        self.default_female_voice = VOICE_B

    async def generate_speech(
        self,
        text: str,
        voice: str,
        speed: float = 1.0
    ) -> bytes:
        """Generate speech bytes from text using Edge TTS."""
        # Edge TTS rate format: +20% or -10%
        rate_pct = int((speed - 1.0) * 100)
        rate_str = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"

        communicate = edge_tts.Communicate(text=text, voice=voice, rate=rate_str)

        audio_bytes = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_bytes += chunk["data"]

        return audio_bytes

    async def generate_podcast_audio(
        self,
        script: List[Dict[str, Any]],
        voice_male: Optional[str] = None,
        voice_female: Optional[str] = None,
        speed: float = 1.0
    ) -> tuple[bytes, float]:
        """Generate full podcast audio from a script list."""

        male_voice  = voice_male  or self.default_male_voice
        female_voice = voice_female or self.default_female_voice

        audio_segments: List[bytes] = []
        total_duration = 0.0

        for entry in script:
            speaker = entry.get("speaker", "A")
            text    = entry.get("text", "").strip()

            if not text or entry.get("is_recap", False):
                continue

            voice = male_voice if speaker == "A" else female_voice

            try:
                segment = await self.generate_speech(text=text, voice=voice, speed=speed)
                if segment:
                    audio_segments.append(segment)
                    # Estimate duration: ~150 wpm at 1x
                    total_duration += (len(text.split()) / 150) / speed
                    # 400 ms silence between speakers
                    audio_segments.append(b"\x00" * int(0.4 * 44100 * 2))
            except Exception as e:
                print(f"Edge TTS error for speaker {speaker}: {e}")
                continue

        final_audio = b"".join(audio_segments)
        return final_audio, total_duration

    def get_available_voices(self) -> List[Dict[str, str]]:
        return [
            {"id": self.default_male_voice,   "name": "Andrew (Male)"},
            {"id": self.default_female_voice, "name": "Ava (Female)"},
        ]


# Singleton
elevenlabs_service = ElevenLabsService()
