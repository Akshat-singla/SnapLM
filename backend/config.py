from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
import os
load_dotenv();
class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://pguser:mypassword@localhost:5432/snaplm"
    # Ai Model
    ollama_device_a_url: str = "http://localhost:11434"
    ollama_device_b_url: str = "http://localhost:11434"

    log_level: str = "INFO"
    jwt_secret : str = "sample-secret"

    MODEL_MAIN_REASONER: str = "main-reasoner"
    MODEL_GRAPH_BUILDER: str = "graph-builder"

    # Context window limits (must match Modelfile num_ctx)
    CTX_MAIN_REASONER: int = 8192
    CTX_GRAPH_BUILDER: int = 4096

    CF_ACCOUNT_ID: str = os.environ.get("CF_ACCOUNT_ID")
    CF_API_TOKEN: str = os.environ.get("CF_API_TOKEN")
    CF_MODEL: str = os.environ.get("CF_MODEL")

    # How many recent messages the chat agent sees
    CHAT_RECENT_MESSAGES: int = 10

    # The Pydantic V2 way to define settings configurations
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()

# Device routing: which URL serves which model
DEVICE_URLS = {
    settings.MODEL_MAIN_REASONER: settings.ollama_device_a_url,
    settings.MODEL_GRAPH_BUILDER: settings.ollama_device_b_url,
}
