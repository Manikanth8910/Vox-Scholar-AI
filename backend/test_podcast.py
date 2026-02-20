"""
Test script for podcast generation functionality.
Run this to verify the podcast generation pipeline works.
"""
import asyncio
from app.services.openai_service import openai_service
from app.services.elevenlabs_service import elevenlabs_service
from app.services.storage_service import storage_service


async def test_podcast_generation():
    """Test the complete podcast generation pipeline."""
    
    print("=" * 60)
    print("Testing VoxScholar AI Podcast Generation")
    print("=" * 60)
    
    # Test data
    paper_title = "Attention Is All You Need"
    summary = """This paper introduces the Transformer architecture, 
    a novel neural network architecture based solely on attention mechanisms. 
    The model achieves state-of-the-art results on machine translation tasks 
    while being more parallelizable and requiring less training time."""
    
    key_findings = [
        "Self-attention mechanism eliminates need for recurrence",
        "Multi-head attention allows model to focus on different positions",
        "Achieves BLEU score of 28.4 on WMT 2014 English-to-German",
        "Trains significantly faster than recurrent models"
    ]
    
    try:
        # Step 1: Generate script
        print("\n[1/3] Generating podcast script...")
        script = await openai_service.generate_podcast_script(
            paper_title=paper_title,
            summary=summary,
            key_findings=key_findings,
            style="educational"
        )
        
        if not script:
            print("❌ Failed to generate script")
            return
        
        print(f"✅ Generated script with {len(script)} segments")
        print(f"    Preview: {script[0].get('text', '')[:100]}...")
        
        # Step 2: Generate audio
        print("\n[2/3] Generating audio with ElevenLabs...")
        audio_bytes, duration = await elevenlabs_service.generate_podcast_audio(
            script=script,
            speed=1.0
        )
        
        print(f"✅ Generated audio: {len(audio_bytes)} bytes, {duration:.1f} seconds")
        
        # Step 3: Upload to storage
        print("\n[3/3] Uploading to storage...")
        audio_url, local_path = await storage_service.upload_audio(
            audio_bytes=audio_bytes,
            filename="test_podcast.mp3",
            folder="podcasts"
        )
        
        print(f"✅ Uploaded successfully!")
        print(f"    URL: {audio_url}")
        print(f"    Local path: {local_path}")
        
        print("\n" + "=" * 60)
        print("✅ All tests passed! Podcast generation is working.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Check your API keys in .env file")
        print("2. Verify OpenAI API key: OPENAI_API_KEY")
        print("3. Verify ElevenLabs API key: ELEVENLABS_API_KEY")
        print("4. Check your API quotas and billing")
        raise


if __name__ == "__main__":
    print("\nStarting podcast generation test...")
    print("Make sure you have set up your .env file with API keys!\n")
    
    asyncio.run(test_podcast_generation())
