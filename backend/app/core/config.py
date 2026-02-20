from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List, Union
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
    
    # Supabase (Optional APIs and DB Configuration)
    supabase_url: str = ""
    supabase_key: str = ""
    
    # JWT
    secret_key: str = "change-this-secret-key-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4"
    
    # Groq API
    groq_api_key: str = ""
    groq_model: str = "llama3-70b-8192"
    
    # PDF.co 
    pdf_co_api_key: str = ""
    
    # ElevenLabs
    elevenlabs_api_key: str = ""
    voice_id_male: str = "21m00Tcm4TlvDq8ikWAM"
    voice_id_female: str = "2EiwWnGeFN0m4CMYp7k9"
    
    # CORS — stored as a string, split on commas
    cors_origins: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Upload
    max_upload_size: int = 52428800  # 50MB
    upload_dir: str = "./uploads"

    @property
    def cors_origins_list(self) -> List[str]:
        """Returns CORS origins as a list."""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return self.cors_origins


settings = Settings()

