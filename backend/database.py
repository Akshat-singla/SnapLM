from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from backend.config.settings import settings
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


engine = create_async_engine(settings.database_url, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    import logging
    logger = logging.getLogger(__name__)

    try:
        async with engine.begin() as conn:
            # Connectivity check only (no create_all here)
            await conn.execute(text("SELECT 1"))
            logger.info("DB connectivity OK.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise RuntimeError(
            "Database initialization error. Ensure PostgreSQL is running and credentials are correct."
        ) from e