import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "fallback_secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_jwt_secret")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/fundme")
    PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours

    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")