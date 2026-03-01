from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas import responses, requests
from backend.services.user import authenticate_user

router = APIRouter()

@router.post("/api/v1/auth/login", response_model=responses.UserResponse)
async def login_user(request: requests.UserLoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return responses.UserResponse(
        user_id=user.id,
        email=user.email,
        auth_type=user.auth_type,
        auth_provider=user.auth_provider
    )