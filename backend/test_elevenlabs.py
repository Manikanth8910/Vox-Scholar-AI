import asyncio
from app.services.elevenlabs_service import elevenlabs_service

async def test():
    try:
        audio, duration = await elevenlabs_service.generate_podcast_audio([
            {"speaker": "A", "text": "Hello world", "name": "A"}
        ])
        print("Success! Audio length:", len(audio))
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
