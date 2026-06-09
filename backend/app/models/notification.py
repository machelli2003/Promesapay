"""
Notification model for the notification system
"""

from datetime import datetime
from bson import ObjectId


def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    action_url: str = None,
    data: dict = None,
    priority: str = "normal",
    channels: list = None
):
    """
    Create a new notification document
    
    Args:
        user_id: ID of the user receiving notification
        notification_type: Type of notification (payment_received, refund_issued, dispute_reported, etc.)
        title: Notification title
        message: Notification message
        action_url: Optional URL for action button
        data: Optional metadata dictionary
        priority: Priority level (low, normal, high, critical)
        channels: List of channels to deliver (in_app, email, sms, push)
    
    Returns:
        Notification document dict
    """
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "action_url": action_url,
        "data": data or {},
        "priority": priority,
        "channels": channels or ["in_app"],
        "read": False,
        "read_at": None,
        "deleted": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "scheduled_for": None,  # For delayed notifications
        "sent_via": {},  # Track which channels notification was sent via
    }


def create_notification_preference(user_id: str):
    """
    Create default notification preferences for a user
    
    Returns:
        Notification preference document dict
    """
    return {
        "_id": ObjectId(),
        "user_id": ObjectId(user_id) if isinstance(user_id, str) else user_id,
        "email_enabled": True,
        "push_enabled": True,
        "sms_enabled": False,
        "in_app_enabled": True,
        "digest_enabled": True,
        "digest_frequency": "daily",  # daily, weekly, none
        "quiet_hours_enabled": False,
        "quiet_hours_start": "22:00",  # 10 PM
        "quiet_hours_end": "08:00",    # 8 AM
        "notification_types": {
            "payment_received": {
                "email": True,
                "push": True,
                "sms": False,
                "in_app": True,
            },
            "payment_sent": {
                "email": True,
                "push": True,
                "sms": False,
                "in_app": True,
            },
            "refund_issued": {
                "email": True,
                "push": True,
                "sms": False,
                "in_app": True,
            },
            "dispute_reported": {
                "email": True,
                "push": True,
                "sms": False,
                "in_app": True,
            },
            "dispute_resolved": {
                "email": True,
                "push": False,
                "sms": False,
                "in_app": True,
            },
            "two_factor_enabled": {
                "email": True,
                "push": False,
                "sms": True,
                "in_app": True,
            },
            "login_new_device": {
                "email": True,
                "push": True,
                "sms": True,
                "in_app": True,
            },
            "security_alert": {
                "email": True,
                "push": True,
                "sms": True,
                "in_app": True,
            },
            "account_locked": {
                "email": True,
                "push": True,
                "sms": True,
                "in_app": True,
            },
            "password_changed": {
                "email": True,
                "push": False,
                "sms": False,
                "in_app": False,
            },
        },
        "blocked_senders": [],  # List of user IDs to block notifications from
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
