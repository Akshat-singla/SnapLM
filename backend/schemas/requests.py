from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserResponse(BaseModel):
    email: str
    value: Optional[str]

    class Config:
        from_attributes = True  # Required for SQLAlchemy 2.x


class UserListResponse(BaseModel):
    users: List[UserResponse]

class UserCreateRequest(BaseModel):
    email: EmailStr
    value: Optional[str] = None


class UserCreateResponse(BaseModel):
    email: EmailStr
    value: Optional[str] = None

    class Config:
        from_attributes = True

class ServiceBaseResponse(BaseModel):
    success: bool