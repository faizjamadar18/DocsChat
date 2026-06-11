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

    GEMINI_API_KEY: str
    GROQ_API_KEY: str

    GOOGLE_EMBEDDING_MODEL: str = "models/text-embedding-004"
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    MAX_FILE_SIZE_MB: int = 20

    # Deployment
    CORS_ORIGINS: str = "https://docschats.vercel.app"
    CHROMA_PERSISTENT: bool = True

    model_config = SettingsConfigDict(
        env_file=_env_path if os.path.isfile(_env_path) else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
