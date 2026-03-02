from pydantic import BaseModel, EmailStr
from typing import List, Optional

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: Optional[str] = None


class UserResponse(BaseModel):
    email: str
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]


class ServiceBaseResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None

class UserLoginResponse(BaseModel):
    user_id: int
    email: EmailStr
    auth_type: str
    auth_provider: Optional[str] = None

    class Config:
        from_attributes = True