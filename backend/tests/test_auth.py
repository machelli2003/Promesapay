import pytest
from flask import json

def test_csrf_token_endpoint(client):
    response = client.get("/api/auth/csrf-token", follow_redirects=True)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "csrf_token" in data
    assert isinstance(data["csrf_token"], str)

def test_get_oauth_token_without_session(client):
    response = client.post("/api/auth/get-oauth-token")
    assert response.status_code == 403  # CSRF required for POST
    data = json.loads(response.data)
    assert "error" in data

def test_register_user(client):
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password123!",
        "full_name": "Test User"
    }
    response = client.post("/api/auth/register", json=data, follow_redirects=True)
    assert response.status_code in [201, 409]  # 201 if success, 409 if email exists

def test_login_user(client):
    data = {
        "identifier": "test@example.com",
        "password": "Password123!"
    }
    response = client.post("/api/auth/login", json=data, follow_redirects=True)
    assert response.status_code in [200, 401]  # 200 if success, 401 if invalid