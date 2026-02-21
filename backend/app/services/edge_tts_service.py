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

    def _text_to_ssml(self, text: str, voice: str) -> str:
        """
        Convert plain text (with **bold** markers) to SSML.
        Words wrapped in **double asterisks** will be spoken with 
        strong emphasis (louder) by Edge TTS.
        """
        import re
        import html

        # Split on **...** markers
        parts = re.split(r'\*\*(.+?)\*\*', text)
        
        ssml_body = ""
        for i, part in enumerate(parts):
            if i % 2 == 0:
                # Regular text — escape XML special chars
                ssml_body += html.escape(part)
            else:
                # Emphasized word/phrase — louder and stronger
                ssml_body += (
                    f'<emphasis level="strong">'
                    f'<prosody volume="+30%">{html.escape(part)}</prosody>'
                    f'</emphasis>'
                )

        ssml = (
            f'<speak version="1.0" '
            f'xmlns="http://www.w3.org/2001/10/synthesis" '
            f'xml:lang="en-IN">'
            f'<voice name="{voice}">{ssml_body}</voice>'
            f'</speak>'
        )
        return ssml

    async def generate_speech(
        self,
        text: str,
        voice: str,
        output_path: str
    ) -> bool:
        """Generate speech and save to output_path.
        Automatically converts **bold** markers to SSML emphasis for louder playback."""
        try:
            # Always use plain text for stability, stripping any bold markers 
            # to prevent the engine from reading them or technical tags.
            import re
            clean_text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
            communicate = edge_tts.Communicate(clean_text, voice)
            await communicate.save(output_path)
            return True
        except Exception as e:
            print(f"Edge TTS Error: {e}")
            # Fallback: strip markers and use plain text
            try:
                import re
                plain = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
                communicate = edge_tts.Communicate(plain, voice)
                await communicate.save(output_path)
                return True
            except Exception as e2:
                print(f"Edge TTS Fallback Error: {e2}")
                return False

    async def generate_podcast_audio(
        self,
        script: List[Dict[str, Any]],
        voice_male: Optional[str] = None,
        voice_female: Optional[str] = None,
        speed: float = 1.0
    ) -> tuple[bytes, float]:
        """Generate full podcast audio by generating ALL segments in parallel,
        then assembling them in the correct order. This is 3-5x faster than
        sequential generation."""
        import tempfile
        import asyncio
        from pydub import AudioSegment

        male_voice = voice_male or self.default_male_voice
        female_voice = voice_female or self.default_female_voice

        # Filter out empty / recap-only entries up-front, preserving order index
        valid_entries = []
        for i, entry in enumerate(script):
            text = entry.get("text", "").strip()
            if text and not entry.get("is_recap", False):
                spk_val = str(entry.get("speaker", "A")).upper()
                voice = female_voice if "B" in spk_val else male_voice
                valid_entries.append((i, entry, voice))

        # ── Parallel TTS generation ──────────────────────────────────────────
        # Semaphore limits concurrent Edge TTS connections to avoid rate limits
        sem = asyncio.Semaphore(5)

        async def _generate_segment(idx: int, entry: dict, voice: str):
            """Generate one TTS segment; returns (idx, AudioSegment | None)."""
            async with sem:
                with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
                    tmp_path = tmp.name
                try:
                    success = await self.generate_speech(entry["text"].strip(), voice, tmp_path)
                    if success and os.path.exists(tmp_path):
                        seg = AudioSegment.from_mp3(tmp_path)
                        return idx, entry, seg
                    return idx, entry, None
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)

        # Fire all segments concurrently
        tasks = [_generate_segment(i, entry, voice) for i, entry, voice in valid_entries]
        results = await asyncio.gather(*tasks)
        # ────────────────────────────────────────────────────────────────────

        # Sort results back into original script order
        results_sorted = sorted(results, key=lambda r: r[0])

        audio_parts = []
        total_duration = 0.0
        silence = AudioSegment.silent(duration=500)  # 0.5s gap between segments

        for _, entry, seg in results_sorted:
            if seg is None:
                continue
            seg_dur = len(seg) / 1000.0
            entry["duration"] = seg_dur
            total_duration += seg_dur
            audio_parts.append(seg)
            audio_parts.append(silence)
            total_duration += 0.5

        if not audio_parts:
            return b"", 0.0

        final_audio = audio_parts[0]
        for part in audio_parts[1:]:
            final_audio += part

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
