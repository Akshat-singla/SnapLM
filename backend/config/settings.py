from enum import Enum
from pydantic_settings import BaseSettings
from pydantic import Field


class LogLevels(str, Enum):
    debug = "debug"
    info = "info"
    warning = "warning"
    error = "error"
    critical = "critical"


class UvicornSettings(BaseSettings):
    host: str = "0.0.0.0"
    port: int = Field(default=8000, ge=0, le=65535)
    log_level: LogLevels = LogLevels.info
    reload: bool = True


class ApiConfigSettings(BaseSettings):
    title: str = "My API"
    description: str = ""
    version: str = "1.0.0"
    docs_url: str = "/docs"


class Settings(BaseSettings):
    # Database
    database_url: str

    # Ollama Devices
    ollama_device_a_url: str = "http://localhost:11434"
    ollama_device_b_url: str = "http://localhost:11435"

    # Logging
    log_level: str = "INFO"

    # Models
    MODEL_MAIN_REASONER: str = "granite3.3:2b"
    MODEL_GRAPH_BUILDER: str = "graph-builder"

    # Context windows
    CTX_MAIN_REASONER: int = 8192
    CTX_GRAPH_BUILDER: int = 4096

    # Chat history
    CHAT_RECENT_MESSAGES: int = 10

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

# Device routing
DEVICE_URLS = {
    settings.MODEL_MAIN_REASONER: settings.ollama_device_a_url,
    settings.MODEL_GRAPH_BUILDER: settings.ollama_device_b_url,
}