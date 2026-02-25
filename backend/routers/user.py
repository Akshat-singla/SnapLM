from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from starlette import status

from database import get_db
from models.user import User
from schemas import responses, requests

router = APIRouter()

@router.get("/users", response_model=responses.UserListResponse)
async def get_users(
    offset: int = Query(default=0),
    limit: int = Query(default=10),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).offset(offset).limit(limit)
    )
    users = result.scalars().all()

    return {"users": users}

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status


@router.get(
    "/user",
    response_model=responses.UserResponse,
    responses={404: {"model": responses.ErrorResponse}},
)
async def get_user_associated_value(
    email: EmailStr = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.post(
    "/user",
    response_model=responses.ServiceBaseResponse,
    responses={
        400: {"model": responses.ErrorResponse},
        500: {"model": responses.ErrorResponse},
    },
)
async def create_user_associated_value(
    user_in: requests.UserCreateRequest,
    email: EmailStr = Query(...),
    db: AsyncSession = Depends(get_db),
):
    new_user = User(
        email=email,
        value=user_in.value,
    )

    db.add(new_user)

    try:
        await db.commit()
        await db.refresh(new_user)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists",
        )
    except Exception:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error",
        )

    return responses.ServiceBaseResponse(
        success=True,
        message="User created successfully",
    )

@router.delete(
    "/user",
    response_model=responses.ServiceBaseResponse,
    responses={404: {"model": responses.ErrorResponse}},
)
async def delete_user_associated_value(
    email: EmailStr = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    await db.delete(user)
    await db.commit()

    return responses.ServiceBaseResponse(
        success=True,
        message="User deleted successfully",
    )

@router.put("/user", response_model=responses.ServiceBaseResponse)
async def update_user_associated_value(email: EmailStr = Query(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email == email)
    )
