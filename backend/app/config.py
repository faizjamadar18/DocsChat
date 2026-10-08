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

    # Notion Connector (OAuth public integration)
    NOTION_CLIENT_ID: str = ""
    NOTION_CLIENT_SECRET: str = ""
    NOTION_REDIRECT_URI: str = ""
    FRONTEND_URL: str = "http://localhost:3000"

    # Google Drive Connector (OAuth, drive.file scope only — non-sensitive)
    GOOGLE_DRIVE_CLIENT_ID: str = ""
    GOOGLE_DRIVE_CLIENT_SECRET: str = ""
    GOOGLE_DRIVE_REDIRECT_URI: str = ""

    # GitHub Connector (GitHub App, user flow, Contents read-only)
    GITHUB_APP_CLIENT_ID: str = ""
    GITHUB_APP_CLIENT_SECRET: str = ""
    GITHUB_APP_REDIRECT_URI: str = ""

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
