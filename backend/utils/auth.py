from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
import jwt
import uuid
from database import get_db
from models.db_models import User
from config import settings
from sqlalchemy.future import select

async def get_current_user(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        result = await db.execute(select(User).where(User.user_id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_id(
    user: User = Depends(get_current_user)
) -> uuid.UUID:
    return user.user_id

async def get_optional_user_id(
    authorization: str = Header(None),
    db: AsyncSession = Depends(get_db)
) -> uuid.UUID | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        return uuid.UUID(user_id) if user_id else None
    except:
        return None
