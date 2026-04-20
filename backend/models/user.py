from sqlalchemy import Column, Integer, String
from database import Base


class AuthUser(Base):
    """Simple auth user — stored in 'auth_users' table."""
    __tablename__ = "auth_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
