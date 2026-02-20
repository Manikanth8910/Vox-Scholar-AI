import asyncio
from app.core.supabase import supabase_client

async def test():
    print("Supabase client initialized: ", supabase_client is not None)
    if supabase_client:
        try:
            res = supabase_client.auth.get_user()
            print("API initialized. (Needs token to actually get a user, but connection is open)")
        except Exception as e:
            print(f"Exception calling API: {e}")

if __name__ == "__main__":
    asyncio.run(test())
