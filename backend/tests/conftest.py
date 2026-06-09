import pytest
from unittest.mock import patch, MagicMock
from bson import ObjectId
from datetime import datetime

@pytest.fixture
def app():
    """Create app with mocked database."""
    mock_users_col = MagicMock()
    mock_db = MagicMock()
    
    # Configure find_one to return a test user with a valid password hash
    def find_one_side_effect(query):
        if query.get("email") == "test@example.com" or query.get("username") == "testuser":
            # Return a user with a pre-hashed password (from bcrypt.hashpw(b'Password123!', bcrypt.gensalt()))
            return {
                "_id": ObjectId(),
                "username": "testuser",
                "email": "test@example.com",
                "password": "$2b$12$kJhWgm5/bnL.7fOvLKqJ2.uJqSppd.6h6D8l0aEI2Yt8mVZ.C8jT2",  # hashed Password123!
                "full_name": "Test User",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
        return None
    
    mock_users_col.find_one.side_effect = find_one_side_effect
    mock_users_col.insert_one.return_value = MagicMock(inserted_id=ObjectId())
    mock_users_col.update_one.return_value = MagicMock()
    
    # Apply patches globally for the entire fixture scope
    patcher_users = patch('app.db.users_col', mock_users_col)
    patcher_db = patch('app.db.db', mock_db)
    patcher_users.start()
    patcher_db.start()
    
    try:
        from app import create_app
        app = create_app({
            "TESTING": True,
            "DEBUG": False,
            "RATELIMIT_ENABLED": False,
            "SECRET_KEY": "test_secret_key" * 2,  # 32 chars
            "JWT_SECRET_KEY": "test_jwt_secret" * 2,  # 32 chars
            "MONGO_URI": "mongodb://localhost:27017/test_fundme",
        })
        yield app
    finally:
        patcher_users.stop()
        patcher_db.stop()

@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def registered_user(app, client):
    """Register a test user and return their data."""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "SecurePass123!",
        "full_name": "Test User"
    }
    # In a real test, this would actually call the register endpoint
    # For now, we're using the mocked database
    return user_data


@pytest.fixture
def auth_token(app):
    """Generate a valid JWT token for testing."""
    from app.security.jwt_tokens import create_access_token_for_user
    from bson import ObjectId
    
    user_id = str(ObjectId())
    token = create_access_token_for_user(user_id)
    return token


@pytest.fixture
def admin_token(app):
    """Generate a valid JWT token for admin testing."""
    from app.security.jwt_tokens import create_access_token_for_user
    from bson import ObjectId
    
    admin_id = str(ObjectId())
    token = create_access_token_for_user(admin_id, scope="full")
    return token


@pytest.fixture
def users_col():
    """Mock users collection."""
    from unittest.mock import MagicMock
    return MagicMock()