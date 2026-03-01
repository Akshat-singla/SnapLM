from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserResponse(BaseModel):
    id: int
    email: str
    auth_type: str
    auth_provider: Optional[str] = None
    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    users: List[UserResponse]

class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str

class UserUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    password_hash: Optional[str] = None
    auth_type: Optional[str] = None
    auth_provider: Optional[str] = None

class UserCreateResponse(BaseModel):
    email: EmailStr
    auth_type: str = "password"
    auth_provider: Optional[str] = None

    class Config:
        from_attributes = True

class ServiceBaseResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
