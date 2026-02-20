from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Database
    database_url: str = "sqlite:///./voxscholar.db"
    
    # JWT
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4"
    
    # ElevenLabs
    elevenlabs_api_key: str = ""
    voice_id_male: str = "21m00Tcm4TlvDq8ikWAM"
    voice_id_female: str = "2EiwWnGeFN0m4CMYp7k9"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    
    # Upload
    max_upload_size: int = 52428800  # 50MB
    upload_dir: str = "./uploads"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse comma-separated CORS origins."""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",")]
        return self.cors_origins


settings = Settings()

