from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import jwt
import uuid

from database import get_db
from models.db_models import User
from utils.hashing import hash_password, verify_password
from utils.token import create_access_token
from config import settings

from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: uuid.UUID
    email: EmailStr
    username: str

    class Config:
        from_attributes = True

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    print(f"DEBUG: Received registration request for email: {data.email}")
    email = data.email
    password = data.password
    
    # Simple validation as we replaced EmailStr
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        print(f"DEBUG: Registration failed - User {email} already exists")
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        email=email,
        username=email.split('@')[0], # Default username from email
        password_hash=hash_password(password)
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {"message": "User created", "user_id": str(user.user_id)}


@router.post("/login")
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = data.email
    password = data.password
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.user_id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "username": user.username
        }
    }

from utils.auth import get_current_user

@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return user

@router.post("/refresh")
async def refresh_token(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
):
    # This is a simplified refresh, usually you'd use a refresh token
    # For now, we'll just issue a new access token if the old one is valid (even if near expiry)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    try:
        # We don't verify expiry here to allow refresh 
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"], options={"verify_exp": False})
        user_id = payload.get("sub")
        
        result = await db.execute(select(User).where(User.user_id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        new_token = create_access_token(user.user_id)
        return {"access_token": new_token}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
