"""One-off DB reachability check for Windows batch scripts (multi-line python -c breaks in cmd)."""

import asyncio
import sys

import asyncpg

from config import settings


def _sync_url() -> str:
    u = settings.database_url
    if u.startswith("postgresql+asyncpg://"):
        return "postgresql://" + u.split("postgresql+asyncpg://", 1)[1]
    return u


async def main() -> None:
    try:
        conn = await asyncpg.connect(_sync_url(), timeout=5, command_timeout=5)
        await conn.close()
        print("  Database OK")
    except Exception as e:
        print(f"  Database NOT reachable: {e}")
        print("  From project root run: docker compose up -d   (or start-docker-db.bat)")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
