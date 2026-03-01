from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from ..models.user import User
from backend.services.user import create_user as service_create_user, update_user as service_update_user

async def get_user(session: AsyncSession, user_id: int) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_users(session: AsyncSession, offset: int = 0, limit: int = 10) -> list[User]:
    result = await session.execute(select(User).offset(offset).limit(limit))
    return result.scalars().all()

async def create_user(session: AsyncSession, user_data: dict) -> User:
    existing = await get_user_by_email(session, user_data["email"])
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = await service_create_user(session, user_data)
    return user

async def update_user(session: AsyncSession, user_id: int, update_data: dict) -> User | None:
    user = await get_user(session, user_id) 
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = await service_update_user(session, user, update_data)
    return user