from datetime import datetime
from bson import ObjectId

def create_user_doc(username, email, hashed_password, full_name=""):
    return {
        "_id": ObjectId(),
        "username": username,
        "email": email,
        "email_verified": False,
        "email_verification_token": None,
        "email_verification_expires": None,
        "password": hashed_password,
        "full_name": full_name,
        "bio": "",
        "profile_picture": "",
        "goal_amount": 0,
        "goal_title": "",
        "social_links": {
            "twitter": "",
            "instagram": "",
            "website": ""
        },
        "total_received": 0,
        "wallet_balance": 0.0,  # Available balance for withdrawals
        "total_earned": 0.0,    # Total lifetime earnings
        "total_donations": 0,   # Number of donations received
        "role": "user",  # user | admin
        "security": {
            "two_factor_enabled": False,
            "known_ips": [],
            "last_login_at": None,
            "last_login_ip": None,
            "locked_until": None,
        },
        "admin": {
            "account_status": "active",  # active | suspended | deleted
            "status_reason": None,
            "suspended_at": None,
            "suspended_by": None,  # Admin user ID
            "notes": "",
            "payment_methods": [],
            "bank_account": None
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }