import asyncio
from app.services.openai_service import openai_service
import sqlite3
import json

async def test():
    conn = sqlite3.connect('voxscholar.db')
    cur = conn.cursor()
    cur.execute('SELECT title, summary, key_findings FROM papers WHERE id=24')
    row = cur.fetchone()
    conn.close()

    if not row:
        print("Paper 24 not found")
        return

    title, summary, key_findings_str = row
    
    # Try parsing
    if key_findings_str:
        if isinstance(key_findings_str, str) and key_findings_str.startswith('['):
            key_findings = json.loads(key_findings_str)
        else:
            key_findings = [key_findings_str]
    else:
        key_findings = []
        
    print(f"Key findings count: {len(key_findings)}")
        
    try:
        script = await openai_service.generate_podcast_script(
            paper_title=title,
            summary=summary,
            key_findings=key_findings,
            style="educational",
            voice_male_name="Prabhat",
            voice_female_name="Neerja"
        )
        print("Length of script:", len(script), "Script sample:", script[:50] if script else script)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
