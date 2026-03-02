import asyncio
from database import init_db, get_db

async def test_connection():
    try:
        await init_db()
        print("Database connection successful!")
        print(" Tables created successfully!")
    except Exception as e:
        print(f"Database connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
EOF