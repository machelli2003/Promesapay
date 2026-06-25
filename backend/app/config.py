from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = Field(default="development")

    # Security
    SECRET_KEY: str = Field(default='dev-secret-key-32-chars-minimum!')
    JWT_SECRET_KEY: str = Field(default='dev-jwt-secret-key-32-chars-minimum!')
    JWT_ACCESS_TOKEN_EXPIRES: int = Field(3600, gt=0)  # 1 hour in production

    # Database
    MONGO_URI: str = Field('mongodb://localhost:27017/fundme')

    # Payment
    PAYSTACK_SECRET_KEY: str = Field(default='dev-paystack-key')
    PAYSTACK_PUBLIC_KEY: str = Field('')  # For frontend

    # URLs
    FRONTEND_URL: AnyHttpUrl = Field('http://localhost:5173')
    BACKEND_URL: AnyHttpUrl = Field('http://localhost:5000')

    # OAuth
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    GOOGLE_CALLBACK_URL: str = Field('http://localhost:5000/api/auth/google/callback')

    # Email configuration
    SMTP_SERVER: str = Field('smtp.gmail.com')
    SMTP_PORT: int = Field(587)
    SMTP_USERNAME: str = Field('')
    SMTP_PASSWORD: str = Field('')
    SMTP_FROM_EMAIL: str = Field('noreply@promesapay.com')
    SMTP_FROM_NAME: str = Field('PromesaPay')
    EMAIL_VERIFICATION_EXPIRY: int = Field(3600, gt=0)  # 1 hour
    PASSWORD_RESET_EXPIRY: int = Field(3600, gt=0)  # 1 hour

    # Redis/Caching
    REDIS_URL: str = Field('redis://localhost:6379/0')

    # Logging
    LOG_LEVEL: str = Field('INFO')
    LOG_FILE: str = Field('logs/app.log')

    # Security (Production)
    SESSION_COOKIE_SECURE: bool = Field(False)
    SESSION_COOKIE_HTTPONLY: bool = Field(True)
    SESSION_COOKIE_SAMESITE: str = Field('Lax')
    SESSION_COOKIE_DOMAIN: str | None = Field(None)

    # Rate Limiting
    RATELIMIT_STORAGE_URL: str = Field('memory://')
    RATELIMIT_STRATEGY: str = Field('fixed-window')

    # Security layer
    SECURITY_MAX_LOGIN_ATTEMPTS: int = Field(5, gt=0)
    SECURITY_MAX_IP_LOGIN_ATTEMPTS: int = Field(20, gt=0)
    SECURITY_LOGIN_WINDOW_MINUTES: int = Field(15, gt=0)
    SECURITY_LOCKOUT_MINUTES: int = Field(30, gt=0)
    SECURITY_PRE_AUTH_TOKEN_MINUTES: int = Field(5, gt=0)
    SECURITY_RECOVERY_TOKEN_MINUTES: int = Field(15, gt=0)
    SECURITY_RECOVERY_CODE_MINUTES: int = Field(10, gt=0)

    # CORS
    CORS_ORIGINS: str = Field('http://localhost:5173')

    model_config = {
        'env_file': '.env',
        'env_file_encoding': 'utf-8',
        'extra': 'ignore'  # Allow extra fields from .env
    }

    def frontend_origin(self) -> str:
        """Base frontend URL without trailing slash (AnyHttpUrl always adds one)."""
        return str(self.FRONTEND_URL).rstrip("/")

    def frontend_url(self, path: str) -> str:
        """Build a frontend URL path without double slashes."""
        return f"{self.frontend_origin()}/{path.lstrip('/')}"


settings = Settings()
