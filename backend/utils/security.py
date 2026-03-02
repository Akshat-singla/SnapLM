from passlib.context import CryptContext

# Argon2id (preferred). If you prefer bcrypt: schemes=["bcrypt"]
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)

def hash_password(plaintext: str) -> str:
    return pwd_context.hash(plaintext)

def verify_password(plaintext: str, password_hash: str) -> bool:
    return pwd_context.verify(plaintext, password_hash)
