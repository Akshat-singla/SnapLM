
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.schemas.requests import UserCreateRequest, UserUpdateRequest
from backend.utils.security import hash_password
from backend.utils.auth import authenticate

# TODO: Just merge with crud/user.py and remove this file - no real reason to separate them at this point, and it just adds confusion

async def create_user(db: Session, payload: UserCreateRequest) -> User:
    print(payload)
    user = User(
        email=payload['email'],
        auth_type="password",
        password_hash=hash_password(payload['password'])
    )
    db.add(user)
    await db.commit()
    print("Commited to DB")
    await db.refresh(user)
    return user
    
async def update_user(db: Session, user: User, payload: UserUpdateRequest) -> User:
    if payload.email is not None:
        user.email = payload.email
    if payload.auth_type is not None:
        user.auth_type = payload.auth_type
    if payload.auth_provider is not None:
        user.auth_provider = payload.auth_provider
    if payload.password:  # optional
        user.password_hash = hash_password(payload.password)
    await db.commit()
    await db.refresh(user)
    return user

async def authenticate_user(db: Session, email: str, password: str) -> User | None:
    return await authenticate(db, email, password)