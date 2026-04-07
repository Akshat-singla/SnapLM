import uuid

from fastapi import HTTPException
from models.db_models import Project, User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_user(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await session.execute(select(User).where(User.user_id == user_id))
    return result.scalar_one_or_none()


async def get_user_or_404(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def create_user(
    session: AsyncSession, username: str, email: str
) -> User:
    user = User(username=username, email=email)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def update_user(
    session: AsyncSession,
    user_id: uuid.UUID,
    *,
    username: str | None = None,
    email: str | None = None,
) -> User:
    user = await get_user_or_404(session, user_id)
    if username is not None:
        user.username = username
    if email is not None:
        user.email = email
    await session.commit()
    await session.refresh(user)
    return user


async def list_projects_for_user(
    session: AsyncSession, user_id: uuid.UUID
) -> list[Project]:
    result = await session.execute(
        select(Project)
        .where(Project.owner_id == user_id)
        .order_by(Project.created_at.desc())
    )
    return list(result.scalars().all())
