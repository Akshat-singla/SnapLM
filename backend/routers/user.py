import uuid

from database import get_db
from fastapi import APIRouter, Depends, Header, HTTPException
from models.db_models import Project, User
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/user")


# ── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr


class UpdateProfileRequest(BaseModel):
    username: str | None = None
    email: EmailStr | None = None


class ProjectSummary(BaseModel):
    project_id: str
    name: str
    node_count: int
    created_at: str


class UserProfileResponse(BaseModel):
    user_id: str
    username: str
    email: str
    created_at: str
    projects: list[ProjectSummary]


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_user_or_404(session: AsyncSession, user_id: str) -> User:
    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user id")
    result = await session.execute(select(User).where(User.user_id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


async def _user_projects(session: AsyncSession, user_id: uuid.UUID) -> list[ProjectSummary]:
    from models.db_models import Node
    result = await session.execute(
        select(Project, func.count(Node.node_id).label("node_count"))
        .outerjoin(Node, Project.project_id == Node.project_id)
        .where(Project.owner_id == user_id)
        .group_by(Project.project_id)
        .order_by(Project.created_at.desc())
    )
    return [
        ProjectSummary(
            project_id=str(row[0].project_id),
            name=row[0].name,
            node_count=row[1],
            created_at=row[0].created_at.isoformat() if row[0].created_at else "",
        )
        for row in result
    ]


def _profile_response(user: User, projects: list[ProjectSummary]) -> UserProfileResponse:
    return UserProfileResponse(
        user_id=str(user.user_id),
        username=user.username or "",
        email=user.email,
        created_at=user.created_at.isoformat() if user.created_at else "",
        projects=projects,
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserProfileResponse)
async def register(data: RegisterRequest, session: AsyncSession = Depends(get_db)):
    # Check duplicate username or email
    existing = await session.execute(
        select(User).where(
            (User.username == data.username) | (User.email == data.email)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already taken")

    user = User(username=data.username, email=data.email)
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return _profile_response(user, [])


@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(
    x_user_id: str = Header(..., alias="X-User-Id"),
    session: AsyncSession = Depends(get_db),
):
    user = await _get_user_or_404(session, x_user_id)
    projects = await _user_projects(session, user.user_id)
    return _profile_response(user, projects)


@router.put("/profile/update", response_model=UserProfileResponse)
async def update_profile(
    data: UpdateProfileRequest,
    x_user_id: str = Header(..., alias="X-User-Id"),
    session: AsyncSession = Depends(get_db),
):
    user = await _get_user_or_404(session, x_user_id)

    if data.username is not None:
        user.username = data.username
    if data.email is not None:
        user.email = data.email

    await session.commit()
    await session.refresh(user)

    projects = await _user_projects(session, user.user_id)
    return _profile_response(user, projects)
