from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import jwt
import uuid
import pyotp

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

class OTPVerifyRequest(BaseModel):
    code: str
    temp_token: str | None = None

class UserResponse(BaseModel):
    user_id: uuid.UUID
    email: EmailStr
    username: str
    is_2fa_enabled: bool

    class Config:
        from_attributes = True

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register")
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = data.email
    password = data.password
    result = await db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
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

    if user.is_2fa_enabled:
        # Issue a temporary token meant only for 2FA validation
        temp_token = create_access_token(user.user_id) # Should ideally be scoped, but we'll adapt to existing create_access_token
        return {
            "requires_2fa": True,
            "temp_token": temp_token
        }

    token = create_access_token(user.user_id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "username": user.username,
            "is_2fa_enabled": user.is_2fa_enabled
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
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    try:
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

@router.post("/2fa/setup")
async def setup_2fa(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    secret = pyotp.random_base32()
    # Save the secret temporarily or directly. Let's save directly, but don't enable until verified
    user.totp_secret = secret
    await db.commit()
    
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name="SnapLM")
    
    return {"secret": secret, "uri": provisioning_uri}

@router.post("/2fa/enable")
async def enable_2fa(data: OTPVerifyRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    if not user.totp_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
        
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")
        
    user.is_2fa_enabled = True
    await db.commit()
    return {"message": "2FA successfully enabled"}

@router.post("/2fa/verify")
async def verify_2fa_login(data: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    if not data.temp_token:
        raise HTTPException(status_code=401, detail="Missing temporary token")
        
    try:
        payload = jwt.decode(data.temp_token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid temp token")
        
    result = await db.execute(select(User).where(User.user_id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_2fa_enabled or not user.totp_secret:
        raise HTTPException(status_code=400, detail="Invalid user or 2FA not enabled")
        
    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(data.code):
        raise HTTPException(status_code=401, detail="Invalid 2FA code")
        
    # Successfully verified, issue standard login response
    token = create_access_token(user.user_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.user_id),
            "email": user.email,
            "username": user.username,
            "is_2fa_enabled": user.is_2fa_enabled
        }
    }

@router.post("/2fa/disable")
async def disable_2fa(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    user.is_2fa_enabled = False
    user.totp_secret = None
    await db.commit()
    return {"message": "2FA successfully disabled"}

