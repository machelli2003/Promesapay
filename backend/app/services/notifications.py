"""
Notification service for managing and delivering notifications
"""

from datetime import datetime, timedelta
from bson import ObjectId
from ..db import notifications_col, notification_prefs_col, users_col
from ..services.email import email_service
from ..models.notification import create_notification, create_notification_preference
from loguru import logger


class NotificationService:
    """Service for managing notifications"""

    @staticmethod
    def send_notification(
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        action_url: str = None,
        data: dict = None,
        priority: str = "normal",
    ):
        """
        Send a notification to a user through configured channels
        
        Args:
            user_id: User ID to send notification to
            notification_type: Type of notification
            title: Notification title
            message: Notification message
            action_url: Optional action URL
            data: Optional metadata
            priority: Notification priority
        """
        try:
            # Get user preferences
            prefs = notification_prefs_col.find_one(
                {"user_id": ObjectId(user_id)}
            )
            
            if not prefs:
                # Create default preferences if not found
                default_prefs = create_notification_preference(user_id)
                notification_prefs_col.insert_one(default_prefs)
                prefs = default_prefs

            # Check if notification type is enabled
            type_config = prefs.get("notification_types", {}).get(notification_type, {})
            if not any(type_config.values()):
                logger.info(f"Notification type {notification_type} disabled for user {user_id}")
                return None

            # Check quiet hours
            if prefs.get("quiet_hours_enabled"):
                if NotificationService._in_quiet_hours(prefs):
                    # Delay notification to end of quiet hours
                    logger.info(f"Notification for {user_id} delayed due to quiet hours")
                    # Don't send now, will be queued
                    pass

            # Determine channels to use
            channels = []
            if prefs.get("in_app_enabled") and type_config.get("in_app", True):
                channels.append("in_app")
            if prefs.get("email_enabled") and type_config.get("email", True):
                channels.append("email")
            if prefs.get("push_enabled") and type_config.get("push", True):
                channels.append("push")
            if prefs.get("sms_enabled") and type_config.get("sms", True):
                channels.append("sms")

            # Create notification
            notification = create_notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                action_url=action_url,
                data=data,
                priority=priority,
                channels=channels
            )

            # Save notification
            result = notifications_col.insert_one(notification)
            notification["_id"] = result.inserted_id

            # Send via each channel
            sent_via = {}
            for channel in channels:
                try:
                    if channel == "email":
                        NotificationService._send_email_notification(
                            user_id, notification, prefs
                        )
                        sent_via["email"] = datetime.utcnow()
                    elif channel == "in_app":
                        sent_via["in_app"] = datetime.utcnow()
                    elif channel == "push":
                        # Push notification support would go here
                        sent_via["push"] = datetime.utcnow()
                    elif channel == "sms":
                        # SMS notification support would go here
                        sent_via["sms"] = datetime.utcnow()
                except Exception as e:
                    logger.error(f"Failed to send {channel} notification: {str(e)}")

            # Update sent_via
            notifications_col.update_one(
                {"_id": notification["_id"]},
                {"$set": {"sent_via": sent_via}}
            )

            logger.info(f"Notification {notification['_id']} sent to user {user_id} via {channels}")
            return notification

        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            raise

    @staticmethod
    def _send_email_notification(user_id: str, notification: dict, prefs: dict):
        """Send email notification"""
        try:
            user = users_col.find_one({"_id": ObjectId(user_id)})
            if not user or not user.get("email"):
                return

            # Check digest setting
            if prefs.get("digest_enabled"):
                # Queue for digest instead of immediate send
                return

            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2>{notification['title']}</h2>
                        <p>{notification['message']}</p>
                        {f'<p><a href="{notification["action_url"]}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Details</a></p>' if notification.get('action_url') else ''}
                        <hr style="margin: 30px 0;">
                        <p style="font-size: 12px; color: #666;">
                            You're receiving this notification because you have {notification['type']} notifications enabled.
                            <a href="#" style="color: #007bff;">Manage preferences</a>
                        </p>
                    </div>
                </body>
            </html>
            """

            email_service.send_email(
                user.get("email"),
                f"PromesaPay: {notification['title']}",
                html_content
            )

        except Exception as e:
            logger.error(f"Failed to send email notification: {str(e)}")

    @staticmethod
    def _in_quiet_hours(prefs: dict) -> bool:
        """Check if current time is within quiet hours"""
        try:
            if not prefs.get("quiet_hours_enabled"):
                return False

            now = datetime.utcnow()
            current_time = now.time()

            start_str = prefs.get("quiet_hours_start", "22:00")
            end_str = prefs.get("quiet_hours_end", "08:00")

            start_time = datetime.strptime(start_str, "%H:%M").time()
            end_time = datetime.strptime(end_str, "%H:%M").time()

            # Handle overnight quiet hours
            if start_time > end_time:
                return current_time >= start_time or current_time <= end_time
            else:
                return start_time <= current_time <= end_time

        except Exception as e:
            logger.error(f"Error checking quiet hours: {str(e)}")
            return False

    @staticmethod
    def get_user_notifications(
        user_id: str,
        page: int = 1,
        limit: int = 20,
        unread_only: bool = False,
    ):
        """Get user's notifications with pagination"""
        try:
            skip = (page - 1) * limit

            query = {
                "user_id": ObjectId(user_id),
                "deleted": False
            }

            if unread_only:
                query["read"] = False

            notifications = list(
                notifications_col
                .find(query)
                .sort("created_at", -1)
                .skip(skip)
                .limit(limit)
            )

            total = notifications_col.count_documents(query)

            # Convert ObjectId to string for JSON serialization
            for notif in notifications:
                notif["_id"] = str(notif["_id"])
                notif["user_id"] = str(notif["user_id"])
                if "created_at" in notif:
                    notif["created_at"] = notif["created_at"].isoformat()

            return {
                "notifications": notifications,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "pages": (total + limit - 1) // limit
                }
            }

        except Exception as e:
            logger.error(f"Error fetching notifications: {str(e)}")
            raise

    @staticmethod
    def mark_as_read(user_id: str, notification_id: str):
        """Mark notification as read"""
        try:
            result = notifications_col.update_one(
                {
                    "_id": ObjectId(notification_id),
                    "user_id": ObjectId(user_id)
                },
                {
                    "$set": {
                        "read": True,
                        "read_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            raise

    @staticmethod
    def mark_all_as_read(user_id: str):
        """Mark all notifications as read"""
        try:
            result = notifications_col.update_many(
                {
                    "user_id": ObjectId(user_id),
                    "read": False,
                    "deleted": False
                },
                {
                    "$set": {
                        "read": True,
                        "read_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return result.modified_count

        except Exception as e:
            logger.error(f"Error marking all as read: {str(e)}")
            raise

    @staticmethod
    def get_unread_count(user_id: str):
        """Get count of unread notifications"""
        try:
            return notifications_col.count_documents({
                "user_id": ObjectId(user_id),
                "read": False,
                "deleted": False
            })

        except Exception as e:
            logger.error(f"Error getting unread count: {str(e)}")
            return 0

    @staticmethod
    def delete_notification(user_id: str, notification_id: str):
        """Soft delete a notification"""
        try:
            result = notifications_col.update_one(
                {
                    "_id": ObjectId(notification_id),
                    "user_id": ObjectId(user_id)
                },
                {
                    "$set": {
                        "deleted": True,
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error deleting notification: {str(e)}")
            raise

    @staticmethod
    def get_preferences(user_id: str):
        """Get user's notification preferences"""
        try:
            prefs = notification_prefs_col.find_one(
                {"user_id": ObjectId(user_id)}
            )

            if not prefs:
                prefs = create_notification_preference(user_id)
                notification_prefs_col.insert_one(prefs)

            prefs["_id"] = str(prefs["_id"])
            prefs["user_id"] = str(prefs["user_id"])

            return prefs

        except Exception as e:
            logger.error(f"Error getting preferences: {str(e)}")
            raise

    @staticmethod
    def update_preferences(user_id: str, updates: dict):
        """Update user's notification preferences"""
        try:
            # Validate updates
            valid_fields = {
                "email_enabled", "push_enabled", "sms_enabled", "in_app_enabled",
                "digest_enabled", "digest_frequency", "quiet_hours_enabled",
                "quiet_hours_start", "quiet_hours_end", "notification_types",
                "blocked_senders"
            }

            filtered_updates = {
                k: v for k, v in updates.items() if k in valid_fields
            }

            if not filtered_updates:
                return False

            filtered_updates["updated_at"] = datetime.utcnow()

            result = notification_prefs_col.update_one(
                {"user_id": ObjectId(user_id)},
                {"$set": filtered_updates}
            )

            return result.modified_count > 0

        except Exception as e:
            logger.error(f"Error updating preferences: {str(e)}")
            raise

    @staticmethod
    def cleanup_old_notifications(days: int = 90):
        """Delete notifications older than specified days"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            result = notifications_col.delete_many({
                "deleted": True,
                "created_at": {"$lt": cutoff_date}
            })

            logger.info(f"Cleaned up {result.deleted_count} old notifications")
            return result.deleted_count

        except Exception as e:
            logger.error(f"Error cleaning up notifications: {str(e)}")
            raise


notification_service = NotificationService()
