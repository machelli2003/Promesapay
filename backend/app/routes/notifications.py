"""
Notification routes for the notification system
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from ..services.notifications import notification_service
from ..security.rate_limits import notification_send_limit
from ..errors import ValidationError, NotFoundError, AuthorizationError
from ..utils.auth_helpers import serialize_doc
from loguru import logger

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@notifications_bp.route("/send", methods=["POST"])
@jwt_required()
@notification_send_limit
def send_notification():
    """Send a notification (admin only or system)"""
    user_id = get_jwt_identity()
    data = request.get_json()

    recipient_id = data.get("recipient_id")
    notification_type = data.get("type")
    title = data.get("title")
    message = data.get("message")
    action_url = data.get("action_url")
    priority = data.get("priority", "normal")

    if not all([recipient_id, notification_type, title, message]):
        raise ValidationError("recipient_id, type, title, and message are required")

    if notification_type not in [
        "payment_received", "payment_sent", "refund_issued", "dispute_reported",
        "dispute_resolved", "two_factor_enabled", "login_new_device",
        "security_alert", "account_locked", "password_changed"
    ]:
        raise ValidationError("Invalid notification type")

    if priority not in ["low", "normal", "high", "critical"]:
        raise ValidationError("Priority must be low, normal, high, or critical")

    try:
        notification = notification_service.send_notification(
            user_id=recipient_id,
            notification_type=notification_type,
            title=title,
            message=message,
            action_url=action_url,
            data=data.get("data"),
            priority=priority
        )

        return jsonify({
            "message": "Notification sent successfully",
            "notification_id": str(notification["_id"])
        }), 201

    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        raise ValidationError("Failed to send notification")


@notifications_bp.route("/my-notifications", methods=["GET"])
@jwt_required()
def get_my_notifications():
    """Get user's notifications"""
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    unread_only = request.args.get("unread_only", False, type=lambda x: x.lower() == "true")

    if page < 1 or limit < 1 or limit > 100:
        raise ValidationError("Invalid pagination parameters")

    try:
        result = notification_service.get_user_notifications(
            user_id=user_id,
            page=page,
            limit=limit,
            unread_only=unread_only
        )

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error fetching notifications: {str(e)}")
        raise ValidationError("Failed to fetch notifications")


@notifications_bp.route("/<notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark notification as read"""
    user_id = get_jwt_identity()

    try:
        success = notification_service.mark_as_read(user_id, notification_id)

        if not success:
            raise NotFoundError("Notification not found")

        return jsonify({"message": "Notification marked as read"}), 200

    except Exception as e:
        logger.error(f"Error marking notification as read: {str(e)}")
        raise


@notifications_bp.route("/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read"""
    user_id = get_jwt_identity()

    try:
        count = notification_service.mark_all_as_read(user_id)

        return jsonify({
            "message": f"Marked {count} notifications as read",
            "count": count
        }), 200

    except Exception as e:
        logger.error(f"Error marking all as read: {str(e)}")
        raise


@notifications_bp.route("/unread-count", methods=["GET"])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications"""
    user_id = get_jwt_identity()

    try:
        count = notification_service.get_unread_count(user_id)

        return jsonify({
            "unread_count": count
        }), 200

    except Exception as e:
        logger.error(f"Error getting unread count: {str(e)}")
        raise


@notifications_bp.route("/<notification_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notification_id):
    """Delete (soft delete) a notification"""
    user_id = get_jwt_identity()

    try:
        success = notification_service.delete_notification(user_id, notification_id)

        if not success:
            raise NotFoundError("Notification not found")

        return jsonify({"message": "Notification deleted"}), 200

    except Exception as e:
        logger.error(f"Error deleting notification: {str(e)}")
        raise


@notifications_bp.route("/preferences", methods=["GET"])
@jwt_required()
def get_preferences():
    """Get user's notification preferences"""
    user_id = get_jwt_identity()

    try:
        prefs = notification_service.get_preferences(user_id)

        return jsonify({
            "preferences": prefs
        }), 200

    except Exception as e:
        logger.error(f"Error fetching preferences: {str(e)}")
        raise


@notifications_bp.route("/preferences", methods=["PUT"])
@jwt_required()
def update_preferences():
    """Update user's notification preferences"""
    user_id = get_jwt_identity()
    data = request.get_json()

    try:
        success = notification_service.update_preferences(user_id, data)

        if not success:
            raise ValidationError("No valid preference fields provided")

        prefs = notification_service.get_preferences(user_id)

        return jsonify({
            "message": "Preferences updated successfully",
            "preferences": prefs
        }), 200

    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise


@notifications_bp.route("/health", methods=["GET"])
def notification_health():
    """Health check for notification service"""
    return jsonify({
        "status": "healthy",
        "service": "notifications"
    }), 200
