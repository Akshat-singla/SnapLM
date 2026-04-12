from datetime import datetime, timedelta
import jwt
from config import settings

def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
