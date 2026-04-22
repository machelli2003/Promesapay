from datetime import datetime
from bson import ObjectId

def create_user_doc(username, email, hashed_password, full_name=""):
    return {
        "_id": ObjectId(),
        "username": username,
        "email": email,
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
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }