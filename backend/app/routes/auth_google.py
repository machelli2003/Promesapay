from flask import Blueprint, redirect, jsonify
from flask_jwt_extended import create_access_token
from ..db import users_col
from ..utils.auth_helpers import serialize_doc
from .. import oauth
from datetime import datetime
import os

google_bp = Blueprint("google_auth", __name__)


def get_or_create_google_user(google_id, email, name, picture):
    """Find existing Google user or create new one."""
    user = users_col.find_one({"provider": "google", "provider_id": google_id})

    if not user:
        # Also check if email already exists (registered normally before)
        existing = users_col.find_one({"email": email})
        if existing:
            # Link Google to their existing account
            users_col.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "provider": "google",
                    "provider_id": google_id,
                    "picture": picture,
                    "updated_at": datetime.utcnow(),
                }}
            )
            return existing

        # Brand new user — create account
        # Generate a unique username from their name
        base_username = name.lower().replace(" ", "")[:20]
        username = base_username
        counter = 1
        while users_col.find_one({"username": username}):
            username = f"{base_username}{counter}"
            counter += 1

        user_doc = {
            "username": username,
            "email": email,
            "full_name": name,
            "picture": picture,
            "provider": "google",
            "provider_id": google_id,
            "password": None,  # No password for OAuth users
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        users_col.insert_one(user_doc)
        return user_doc

    return user


@google_bp.route("/google/login")
def google_login():
    backend_url = os.getenv("BACKEND_URL", "http://localhost:5000")
    redirect_uri = f"{backend_url}/api/auth/google/callback"
    return oauth.google.authorize_redirect(redirect_uri)


@google_bp.route("/google/callback")
def google_callback():
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

    try:
        token = oauth.google.authorize_access_token()
        user_info = token.get("userinfo")

        user = get_or_create_google_user(
            google_id=user_info["sub"],
            email=user_info["email"],
            name=user_info["name"],
            picture=user_info.get("picture", ""),
        )

        jwt_token = create_access_token(identity=str(user["_id"]))

        # Redirect to frontend with token in URL
        return redirect(f"{frontend_url}/auth/callback?token={jwt_token}")

    except Exception as e:
        return redirect(f"{frontend_url}/login?error=google_auth_failed")