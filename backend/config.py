from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/acm_certificates"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Admin
    ADMIN_EMAIL: str = "admin@acmclub.com"
    ADMIN_PASSWORD: str = "admin123"
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # Supabase Storage
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # App
    ENV: str = "development"
    APP_NAME: str = "ACM Certificate System"
    
    # Email (SMTP)
    EMAIL_HOST: str = ""
    EMAIL_PORT: int = 587
    EMAIL_USERNAME: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    EMAIL_USE_TLS: bool = True
    
    # Frontend URL for verification links in emails
    FRONTEND_VERIFY_URL: str = "http://localhost:5173/verify"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
