from enum import Enum
from functools import lru_cache
from typing import Any

import yaml
from pydantic import BaseSettings, Field

class LogLevels(str, Enum):
    """Enum of permitted log levels."""

    debug = "debug"
    info = "info"
    warning = "warning"
    error = "error"
    critical = "critical"


class UvicornSettings(BaseSettings):
    """Settings for uvicorn server"""

    host: str
    port: int = Field(ge=0, le=65535)
    log_level: LogLevels
    reload: bool


class ApiConfigSettings(BaseSettings):
    """Settings for FastAPI Server"""

    title: str = ""
    description: str = ""
    version: str
    docs_url: str

class Settings(BaseSettings):
    database_url: str
    
    # Ai Model
    ollama_device_a_url: str = "http://localhost:11434"
    ollama_device_b_url: str = "http://localhost:11434"
    
    log_level: str = "INFO"

    MODEL_MAIN_REASONER: str = "main-reasoner"
    MODEL_GRAPH_BUILDER: str = "graph-builder"

    # Context window limits (must match Modelfile num_ctx)
    CTX_MAIN_REASONER: int = 8192
    CTX_GRAPH_BUILDER: int = 4096

    # How many recent messages the chat agent sees
    CHAT_RECENT_MESSAGES: int = 10

    class Config:
        env_file = ".env"

settings = Settings()

# Device routing: which URL serves which model
DEVICE_URLS = {
    settings.MODEL_MAIN_REASONER: settings.ollama_device_a_url,
    settings.MODEL_GRAPH_BUILDER: settings.ollama_device_b_url,
}

def load_from_yaml() -> Any:
    with open("appsettings.yaml") as fp:
        config = yaml.safe_load(fp)
    return config

@lru_cache()
def get_settings() -> Settings:
    yaml_config = load_from_yaml()
    settings = Settings(**yaml_config)
    return settings