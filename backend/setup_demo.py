"""
Create demo user and paper for testing chatbot
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.models.paper import Paper
from app.core.security import get_password_hash
from app.core.database import Base

DATABASE_URL = "sqlite+aiosqlite:///./voxscholar.db"

async def setup_demo():
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Create demo user
        demo_user = User(
            email="demo@voxscholar.ai",
            username="demo",
            hashed_password=get_password_hash("demo123"),
            full_name="Demo User"
        )
        session.add(demo_user)
        await session.flush()
        
        # Create demo paper
        demo_paper = Paper(
            user_id=demo_user.id,
            title="Attention Is All You Need",
            filename="attention.pdf",
            file_path="./demo_paper.pdf",
            file_size=1024000,
            mime_type="application/pdf",
            raw_text="This paper introduces the Transformer architecture. The Transformer uses self-attention mechanisms to process sequences in parallel, unlike RNNs. Multi-head attention allows the model to attend to different representation subspaces.",
            summary="The Transformer architecture replaces recurrence with self-attention for sequence modeling.",
            topics=["transformers", "attention", "neural networks"],
            key_findings=["Self-attention enables parallelization", "Multi-head attention improves performance"],
            methodology="The model uses scaled dot-product attention and multi-head attention layers.",
            is_processed=True,
            processing_status="completed"
        )
        session.add(demo_paper)
        
        await session.commit()
        
        print("✓ Demo user created:")
        print(f"  Email: demo@voxscholar.ai")
        print(f"  Password: demo123")
        print(f"  User ID: {demo_user.id}")
        print(f"\n✓ Demo paper created:")
        print(f"  Paper ID: {demo_paper.id}")
        print(f"  Title: {demo_paper.title}")
        print(f"\n✓ You can now test the chatbot!")

if __name__ == "__main__":
    asyncio.run(setup_demo())
