from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship, Mapped, mapped_column
from backend.database import Base
from typing import Optional

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    auth_type: Mapped[str] = mapped_column(String, nullable=False, default="password")  # 'password' or 'oauth'
    password_hash: Mapped[str] = mapped_column(String, nullable=True)  # Can be null for OAuth users
    auth_provider: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # e.g., 'google', 'github'
    projects: Mapped[list["Project"]] = relationship("Project", back_populates="owner")