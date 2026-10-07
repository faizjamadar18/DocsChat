import os
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to this file, so it works regardless of working directory
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")


class Settings(BaseSettings):
    MONGODB_URL: str
    DB_NAME: str = "notebuddy"

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    GOOGLE_CLIENT_ID: str = "placeholder_client_id"

    GEMINI_API_KEY: str
    GROQ_API_KEY: str
    GROQ_MODEL: str = "qwen/qwen3.8-27b"

    GOOGLE_EMBEDDING_MODEL: str = "models/gemini-embedding-2"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    MAX_FILE_SIZE_MB: int = 20

    # Qdrant Configuration
    QDRANT_URL: str
    QDRANT_API_KEY: str

    # Deployment
    CORS_ORIGINS: str = "https://docschats.vercel.app"

    model_config = SettingsConfigDict(
        env_file=_env_path if os.path.isfile(_env_path) else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
