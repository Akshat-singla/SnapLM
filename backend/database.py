from config import settings
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_async_engine(settings.database_url, echo=False)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    import models.db_models  # noqa: F401 — register all models on Base.metadata before create_all

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Backfill schema for existing databases without migrations.
        await conn.execute(
            text(
                "ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;"
            )
        )
        try:
            await conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;"
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN NOT NULL DEFAULT FALSE;"
                    "ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(32);"
                )
            )
        except Exception:
            pass # SQLite syntax limitation for multiple ADD COLUMN or if it already exists in a weird way
