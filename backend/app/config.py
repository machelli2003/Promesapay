from pydantic import BaseSettings, AnyHttpUrl, Field
import os


class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = Field(default="development")

    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ACCESS_TOKEN_EXPIRES: int = Field(3600, gt=0)  # 1 hour in production

    # Database
    MONGO_URI: str = Field('mongodb://localhost:27017/fundme')

    # Payment
    PAYSTACK_SECRET_KEY: str
    PAYSTACK_PUBLIC_KEY: str = Field('')  # For frontend

    # URLs
    FRONTEND_URL: AnyHttpUrl = Field('http://localhost:5173')
    BACKEND_URL: AnyHttpUrl = Field('http://localhost:5000')

    # OAuth
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None

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

    # Rate Limiting
    RATELIMIT_STORAGE_URL: str = Field('memory://')
    RATELIMIT_STRATEGY: str = Field('fixed-window')

    # CORS
    CORS_ORIGINS: str = Field('http://localhost:5173')

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Load environment-specific config
        env = os.getenv('FLASK_ENV', 'development')
        if env == 'production':
            self.Config.env_file = '.env.production'
            # Reload with production env file
            super().__init__(**kwargs)


settings = Settings()
