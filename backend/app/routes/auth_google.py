import logging
from flask import Blueprint, redirect, jsonify, request, session
from urllib.parse import quote_plus
from authlib.integrations.base_client import OAuthError
from ..security.jwt_tokens import create_access_token_for_user
from ..security.fraud_detection import register_successful_login
from ..db import users_col
from ..errors import AuthenticationError
from ..utils.auth_helpers import serialize_doc
from .. import oauth
from ..config import settings
from datetime import datetime

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
        result = users_col.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return user_doc

    return user


@google_bp.route("/google/login")
def google_login():
    return oauth.google.authorize_redirect()


@google_bp.route("/google/callback")
def google_callback():
    """OAuth callback - store token in secure session, redirect to frontend."""
    try:
        logging_url = request.url
        logging.info("Google callback request URL: %s", logging_url)
        token = oauth.google.authorize_access_token()
        user_info = token.get("userinfo")

        user = get_or_create_google_user(
            google_id=user_info["sub"],
            email=user_info["email"],
            name=user_info["name"],
            picture=user_info.get("picture", ""),
        )

        register_successful_login(str(user["_id"]))
        jwt_token = create_access_token_for_user(str(user["_id"]))
        
        # Store token in secure httpOnly session cookie
        session["auth_token"] = jwt_token
        session.permanent = True
        
        # Redirect to frontend success page without token in URL
        return redirect(f"{settings.frontend_url('auth/callback')}?status=success")

    except OAuthError as e:
        callback_args = request.args.to_dict(flat=False)
        logging.error("Google OAuth callback args: %s", callback_args)
        logging.error("Google OAuthError: %s", repr(e))
        logging.error("Google OAuth error details: error=%s description=%s", getattr(e, 'error', None), getattr(e, 'description', None))
        error_message = str(e)
        safe_message = quote_plus(error_message)
        return redirect(f"{settings.frontend_url('login')}?error=google_auth_failed&reason={safe_message}")

    except Exception as e:
        logging.error("Google OAuth callback args: %s", request.args.to_dict(flat=False))
        logging.error("Google OAuth request URL: %s", request.url)
        error_message = str(e)
        logging.error(f"Google OAuth error: {error_message}")
        safe_message = quote_plus(error_message)
        return redirect(f"{settings.frontend_url('login')}?error=google_auth_failed&reason={safe_message}")


@google_bp.route("/get-oauth-token")
def get_oauth_token():
    token = session.get("auth_token")
    if not token:
        raise AuthenticationError("OAuth token not available")
    return jsonify({"token": token}), 200
