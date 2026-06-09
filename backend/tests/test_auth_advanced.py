"""Tests for authentication endpoints."""

import pytest
from bson import ObjectId
from datetime import datetime
from app.utils.auth_helpers import hash_password


@pytest.fixture
def auth_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "SecurePass123!",
        "full_name": "Test User"
    }


class TestRegister:
    """Test user registration."""

    def test_register_success(self, client, auth_user_data, users_col):
        """Test successful user registration."""
        response = client.post("/api/auth/register", json=auth_user_data)
        
        assert response.status_code == 201
        data = response.get_json()
        assert data["message"] == "Account created successfully"
        assert "token" in data
        assert data["user"]["username"] == auth_user_data["username"]
        assert data["user"]["email"] == auth_user_data["email"]
        
        # Verify user created in database
        user = users_col.find_one({"email": auth_user_data["email"]})
        assert user is not None
        assert user["email_verified"] is False

    def test_register_missing_fields(self, client):
        """Test registration with missing fields."""
        response = client.post("/api/auth/register", json={
            "username": "testuser"
        })
        
        assert response.status_code == 400
        assert "required" in response.get_json()["error"].lower()

    def test_register_duplicate_email(self, client, auth_user_data, users_col):
        """Test registration with duplicate email."""
        # Register first user
        client.post("/api/auth/register", json=auth_user_data)
        
        # Try to register with same email
        response = client.post("/api/auth/register", json={
            **auth_user_data,
            "username": "different_user"
        })
        
        assert response.status_code == 409
        assert "already registered" in response.get_json()["error"].lower()

    def test_register_weak_password(self, client, auth_user_data):
        """Test registration with weak password."""
        weak_password_data = {
            **auth_user_data,
            "password": "weak"  # Too short, no special chars
        }
        
        response = client.post("/api/auth/register", json=weak_password_data)
        
        assert response.status_code == 400
        assert "password" in response.get_json()["error"].lower()


class TestLogin:
    """Test user login."""

    def test_login_success(self, client, auth_user_data, registered_user):
        """Test successful login."""
        response = client.post("/api/auth/login", json={
            "identifier": auth_user_data["email"],
            "password": auth_user_data["password"]
        })
        
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert data["user"]["username"] == auth_user_data["username"]

    def test_login_with_username(self, client, auth_user_data, registered_user):
        """Test login with username instead of email."""
        response = client.post("/api/auth/login", json={
            "identifier": auth_user_data["username"],
            "password": auth_user_data["password"]
        })
        
        assert response.status_code == 200
        assert "token" in response.get_json()

    def test_login_invalid_credentials(self, client, registered_user):
        """Test login with invalid credentials."""
        response = client.post("/api/auth/login", json={
            "identifier": "test@example.com",
            "password": "WrongPassword123!"
        })
        
        assert response.status_code == 401
        assert "Invalid credentials" in response.get_json()["error"]

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent email."""
        response = client.post("/api/auth/login", json={
            "identifier": "nonexistent@example.com",
            "password": "AnyPass123!"
        })
        
        assert response.status_code == 401


class TestPasswordReset:
    """Test password reset flow."""

    def test_forgot_password(self, client, registered_user, users_col):
        """Test forgot password email request."""
        response = client.post("/api/auth/forgot-password", json={
            "email": "test@example.com"
        })
        
        assert response.status_code == 200
        assert "sent" in response.get_json()["message"].lower()

    def test_forgot_password_nonexistent(self, client):
        """Test forgot password for non-existent email."""
        response = client.post("/api/auth/forgot-password", json={
            "email": "nonexistent@example.com"
        })
        
        # Should return success for security reasons
        assert response.status_code == 200

    def test_reset_password(self, client, registered_user, users_col):
        """Test password reset with valid token."""
        from app.security.account_recovery import initiate_legacy_reset_link
        
        # Create reset token
        reset_token = initiate_legacy_reset_link("test@example.com")
        
        new_password = "NewSecurePass456!"
        response = client.post("/api/auth/reset-password", json={
            "token": reset_token,
            "new_password": new_password
        })
        
        assert response.status_code == 200
        assert "successfully" in response.get_json()["message"].lower()


class TestEmailVerification:
    """Test email verification."""

    def test_send_verification_email(self, client, registered_user, auth_token):
        """Test sending verification email."""
        response = client.post(
            "/api/auth/send-verification-email",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        assert "sent" in response.get_json()["message"].lower()

    def test_verify_email(self, client, registered_user, users_col):
        """Test email verification with token."""
        from app.utils.auth_helpers import hash_password
        import secrets
        
        # Create verification token
        token = secrets.token_urlsafe(32)
        users_col.update_one(
            {"email": "test@example.com"},
            {
                "$set": {
                    "email_verification_token": hash_password(token),
                    "email_verification_expires": datetime.utcnow().timestamp() + 3600
                }
            }
        )
        
        response = client.post("/api/auth/verify-email", json={
            "token": token
        })
        
        assert response.status_code == 200
        assert "successfully" in response.get_json()["message"].lower()
        
        # Verify user is now verified
        user = users_col.find_one({"email": "test@example.com"})
        assert user["email_verified"] is True

    def test_verify_email_expired_token(self, client, registered_user, users_col):
        """Test email verification with expired token."""
        from app.utils.auth_helpers import hash_password
        import secrets
        
        # Create expired token
        token = secrets.token_urlsafe(32)
        users_col.update_one(
            {"email": "test@example.com"},
            {
                "$set": {
                    "email_verification_token": hash_password(token),
                    "email_verification_expires": datetime.utcnow().timestamp() - 3600  # Expired
                }
            }
        )
        
        response = client.post("/api/auth/verify-email", json={
            "token": token
        })
        
        assert response.status_code == 401

    def test_verification_status(self, client, registered_user, auth_token):
        """Test getting verification status."""
        response = client.get(
            "/api/auth/verification-status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert "email_verified" in data
        assert "email" in data


class TestCsrfToken:
    """Test CSRF token endpoints."""

    def test_get_csrf_token(self, client):
        """Test getting CSRF token."""
        response = client.get("/api/csrf-token")
        
        assert response.status_code == 200
        data = response.get_json()
        assert "csrf_token" in data
        assert len(data["csrf_token"]) > 0
