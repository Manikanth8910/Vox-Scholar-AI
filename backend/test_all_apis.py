import asyncio
import aiohttp
import sqlite3
import json
import os
import sys

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security import create_access_token

BASE_URL = "http://localhost:6279/api"

async def test_apis():
    print("--- Starting API Checks ---")
    
    # Generate token for user_id = 2
    token = create_access_token(data={"sub": "2"})
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Generated token for User ID 2: {token[:10]}...")
    
    async with aiohttp.ClientSession() as session:
        # 2. Auth 'Me'
        async with session.get(f"{BASE_URL}/auth/me", headers=headers) as resp:
            print("Get Me:", resp.status)
            if resp.status != 200:
                print(await resp.text())
            
        # 3. Papers List
        async with session.get(f"{BASE_URL}/papers/", headers=headers) as resp:
            print("Get Papers:", resp.status)
            papers = await resp.json()
            # print("Papers:", papers)
            paper_id = None
            for p in papers:
                if p["id"] == 24:
                    paper_id = 24
                    break
            if not paper_id and papers:
                paper_id = papers[0]["id"]
            
        if paper_id:
            print(f"Testing with Paper ID: {paper_id}")
            # 4. Get specific paper
            async with session.get(f"{BASE_URL}/papers/{paper_id}", headers=headers) as resp:
                print(f"Get Paper {paper_id}:", resp.status)
                paper_data = await resp.json()
                is_processed = paper_data.get("is_processed")
                
            if is_processed:
                print("Paper is processed. Checking endpoints...")
                # 5. Flowchart
                async with session.get(f"{BASE_URL}/papers/{paper_id}/flowchart", headers=headers) as resp:
                    print(f"Get Flowchart {paper_id}:", resp.status)
                    if resp.status != 200:
                        print("Flowchart Error:", await resp.text())
                        
                # 6. Chat History
                async with session.get(f"{BASE_URL}/chat/history/{paper_id}", headers=headers) as resp:
                    print(f"Get Chat History {paper_id}:", resp.status)
                    if resp.status != 200:
                        print("Chat Error:", await resp.text())
                
                # 6.5 Send a message to Chat
                async with session.post(f"{BASE_URL}/chat", headers=headers, json={"paper_id": paper_id, "message": "What is the main topic?"}) as resp:
                    print(f"Post Chat {paper_id}:", resp.status)
                    if resp.status != 200:
                        print("Post Chat Error:", await resp.text())    
                        
                # 7. Podcasts List
                async with session.get(f"{BASE_URL}/podcasts/", headers=headers) as resp:
                    print("Get Podcasts:", resp.status)
                    
                # 8. Generate Podcast (WARNING: might be slow, so let's check status first)
                print("Skipping full podcast generation, testing flowchart and chat are enough for now.")
            else:
                print(f"Paper {paper_id} not processed, skipping flowchart/chat checks.")
                
        # 9. Services (Voices)
        async with session.get(f"{BASE_URL}/services/voices/edge-tts") as resp:
            print("Get Edge TTS Voices:", resp.status)
                
        async with session.get(f"{BASE_URL}/services/voices/elevenlabs") as resp:
            print("Get ElevenLabs Voices:", resp.status)

    print("--- API Checks Complete ---")

if __name__ == "__main__":
    asyncio.run(test_apis())
