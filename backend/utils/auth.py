from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.utils.security import verify_password
from backend.models.user import User

async def authenticate(db: Session, email: str, password: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    if not user or user.auth_type != "password":
        return None
    if not user.password_hash:
        return None
    return user if verify_password(password, user.password_hash) else None
