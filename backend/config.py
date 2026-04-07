from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://pguser:mypassword@localhost:5432/snaplm"
    # Ai Model
    ollama_device_a_url: str = "http://localhost:11434"
    ollama_device_b_url: str = "http://localhost:11434"

    log_level: str = "INFO"

    MODEL_MAIN_REASONER: str = "main-reasoner"
    MODEL_GRAPH_BUILDER: str = "graph-builder"

    # Context window limits (must match Modelfile num_ctx; keep low for small models)
    CTX_MAIN_REASONER: int = 2048
    CTX_GRAPH_BUILDER: int = 2048

    # How many recent messages the chat agent sees
    CHAT_RECENT_MESSAGES: int = 6

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
