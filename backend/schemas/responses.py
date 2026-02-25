from pydantic import BaseModel
from typing import List, Optional


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: Optional[str] = None


class UserResponse(BaseModel):
    email: str
    value: Optional[str]

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: List[UserResponse]


class ServiceBaseResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None