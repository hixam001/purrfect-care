"""
Purrfect Care — Application Configuration

Loads all environment variables and provides a typed Settings object
used across the application via dependency injection.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- App ---
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    APP_PORT: int = 8000
    APP_HOST: str = "0.0.0.0"

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://purrfect-care-app.web.app"

    # --- Supabase ---
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str = ""  # Found in Dashboard > Settings > API > JWT Secret

    # --- Safepay ---
    SAFEPAY_PUBLIC_KEY: str = ""
    SAFEPAY_SECRET_KEY: str = ""
    SAFEPAY_WEBHOOK_SECRET: str = ""
    SAFEPAY_ENV: str = "sandbox"  # "sandbox" or "production"

    # --- OpenAI ---
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # --- Email (Resend) ---
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "onboarding@resend.dev"

    # --- Firebase ---
    FBASE_CREDENTIALS_PATH: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """
    Cached settings singleton.
    Call this via FastAPI's Depends() or directly.
    """
    return Settings()
