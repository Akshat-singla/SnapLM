from fastapi import APIRouter, Depends, Query, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas import responses, requests
from backend.crud import user as user_crud

router = APIRouter(prefix="/api/v1", tags=["users"])

@router.get("/users", response_model=responses.UserListResponse)
async def get_users(
    offset: int = Query(default=0),
    limit: int = Query(default=10),
    db: AsyncSession = Depends(get_db),
):
    users = await user_crud.get_users(db, offset, limit)
    return {"users": users}

@router.get("/users/{user_id}", response_model=responses.UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    user = await user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/users", response_model=responses.UserResponse)
async def create_user(
    user_in: requests.UserCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check if user already exists
    existing_user = await user_crud.get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    user = await user_crud.create_user(db, user_in.model_dump())
    return user

@router.put("/users/{user_id}", response_model=responses.UserResponse)
async def update_user(
    user_id: int,
    user_in: requests.UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await user_crud.update_user(db, user_id, user_in.model_dump(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user