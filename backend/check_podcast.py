import asyncio
from app.services.openai_service import openai_service
from app.services.edge_tts_service import edge_tts_service
import sqlite3

async def test_generation():
    # Attempt simulated podcast generation exactly as the backend would do it
    print("Testing OpenAI...")
    try:
        script = await openai_service.generate_podcast_script(
            "this is a sample paper about AI agents",
            "educator", "skeptic", "casual"
        )
        print("Script generated successfully. Segments:", len(script))
    except Exception as e:
        print("OpenAI Error:", e)
        return

    print("Testing Edge TTS...")
    try:
        audio, duration = await edge_tts_service.generate_podcast_audio(script)
        print("Audio generated. Bytes:", len(audio), "Duration:", duration)
    except Exception as e:
        print("Edge TTS Error:", e)

asyncio.run(test_generation())
