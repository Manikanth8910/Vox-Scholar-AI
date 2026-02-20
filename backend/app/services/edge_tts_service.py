"""
TTS service using Microsoft Edge TTS (Free, no API key required).
Supports high-quality neural voices including Indian English accents.
"""
import asyncio
import os
import edge_tts
from typing import List, Dict, Any, Optional

class EdgeTTSService:
    """TTS service wrapping edge-tts."""

    def __init__(self):
        # Default Indian English voices
        self.default_male_voice = "en-IN-PrabhatNeural"
        self.default_female_voice = "en-IN-NeerjaNeural"

    async def generate_speech(
        self,
        text: str,
        voice: str,
        output_path: str
    ) -> bool:
        """Generate speech and save to output_path."""
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            return True
        except Exception as e:
            print(f"Edge TTS Error: {e}")
            return False

    async def generate_podcast_audio(
        self,
        script: List[Dict[str, Any]],
        voice_male: Optional[str] = None,
        voice_female: Optional[str] = None,
        speed: float = 1.0
    ) -> tuple[bytes, float]:
        """Generate full podcast audio by concatenating segments."""
        import tempfile
        import aiofiles
        from pydub import AudioSegment
        
        male_voice = voice_male or self.default_male_voice
        female_voice = voice_female or self.default_female_voice

        audio_parts = []
        total_duration = 0.0
        
        # We process segments sequentially for edge-tts to avoid rate limits/locking
        # though it can be parallelized if needed.
        for i, entry in enumerate(script):
            speaker = entry.get("speaker", "A")
            text = entry.get("text", "").strip()
            if not text or entry.get("is_recap", False):
                continue
                
            # Ultra-robust speaker detection
            spk_val = str(entry.get("speaker", "A")).upper()
            
            # Since the script generator guarantees "A" and "B", just look for "B"
            is_female = "B" in spk_val
            
            voice = female_voice if is_female else male_voice
            
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                tmp_path = tmp.name
            
            success = await self.generate_speech(text, voice, tmp_path)
            
            if success:
                seg_audio = AudioSegment.from_mp3(tmp_path)
                audio_parts.append(seg_audio)
                
                seg_dur = len(seg_audio) / 1000.0
                entry["duration"] = seg_dur
                total_duration += seg_dur
                
                # Physical 0.5s silence gap
                silence = AudioSegment.silent(duration=500)
                audio_parts.append(silence)
                total_duration += 0.5
                
                
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        
        if not audio_parts:
            return b"", 0.0
            
        final_audio = audio_parts[0]
        for part in audio_parts[1:]:
            final_audio += part
            
        # Export final audio to memory
        import io
        mp3_io = io.BytesIO()
        final_audio.export(mp3_io, format="mp3")
        return mp3_io.getvalue(), total_duration

    def get_available_voices(self) -> List[Dict[str, str]]:
        return [
            {"id": "en-IN-NeerjaNeural", "name": "Neerja (India - Female)"},
            {"id": "en-IN-PrabhatNeural", "name": "Prabhat (India - Male)"},
            {"id": "en-IN-PriyaNeural", "name": "Priya (India - Female)"},
            {"id": "en-IN-RaviNeural", "name": "Ravi (India - Male)"},
            {"id": "en-US-AndrewNeural", "name": "Andrew (US - Male)"},
            {"id": "en-US-EmmaNeural", "name": "Emma (US - Female)"},
            {"id": "en-GB-SoniaNeural", "name": "Sonia (UK - Female)"},
            {"id": "en-GB-RyanNeural", "name": "Ryan (UK - Male)"},
        ]

# Singleton
edge_tts_service = EdgeTTSService()
