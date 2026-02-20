import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.crud.user import get_user_by_email, create_user
from app.schemas.user import UserCreate

async def create_demo_account():
    async with AsyncSessionLocal() as db:
        demo_email = "demo@voxscholar.ai"
        existing_user = await get_user_by_email(db, demo_email)
        
        if existing_user:
            print(f"Demo user '{demo_email}' already exists!")
            return
            
        user_in = UserCreate(
            email=demo_email,
            password="Password123!",
            full_name="Demo User",
            username="demouser"
        )
        
        try:
            demo_user = await create_user(db, user_in)
            print(f"Successfully created demo user '{demo_email}' with password 'Password123!'")
        except Exception as e:
            print(f"Failed to create demo user: {e}")

if __name__ == "__main__":
    asyncio.run(create_demo_account())
