from pydantic import BaseModel
from typing import List, Optional

class UserResponse(BaseModel):
    email: str
    value: Optional[str]

    class Config:
        from_attributes = True  # Required for SQLAlchemy 2.x


class UserListResponse(BaseModel):
    users: List[UserResponse]


class ServiceBaseResponse(BaseModel):
    success: bool