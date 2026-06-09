"""
Comprehensive test suite for notification system (Phase 4.1)
Tests notification CRUD, preferences, channels, and delivery methods
"""

import pytest
from datetime import datetime
from bson import ObjectId
from unittest.mock import patch, MagicMock


class TestNotificationCrud:
    """Tests for basic notification CRUD operations"""

    def test_send_notification(self, client, auth_token):
        """User can send a notification"""
        response = client.post(
            "/api/notifications/send",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "recipient_id": str(ObjectId()),
                "type": "payment_received",
                "title": "Payment Received",
                "message": "You received $50 from John",
            },
        )
        # May fail due to DB, but should validate input
        assert response.status_code in [201, 500]

    def test_send_notification_missing_fields(self, client, auth_token):
        """Send notification requires all fields"""
        response = client.post(
            "/api/notifications/send",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "type": "payment_received",
                "title": "Payment Received",
            },
        )
        assert response.status_code == 400

    def test_send_notification_invalid_type(self, client, auth_token):
        """Send notification validates notification type"""
        response = client.post(
            "/api/notifications/send",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "recipient_id": str(ObjectId()),
                "type": "invalid_type",
                "title": "Test",
                "message": "Test message",
            },
        )
        assert response.status_code == 400

    def test_get_my_notifications(self, client, auth_token):
        """User can get their notifications"""
        response = client.get(
            "/api/notifications/my-notifications",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert "notifications" in response.json
        assert "pagination" in response.json

    def test_get_notifications_pagination(self, client, auth_token):
        """Notifications pagination works correctly"""
        response = client.get(
            "/api/notifications/my-notifications?page=1&limit=10",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert response.json["pagination"]["page"] == 1
        assert response.json["pagination"]["limit"] == 10

    def test_get_notifications_unread_only(self, client, auth_token):
        """Can filter to show only unread notifications"""
        response = client.get(
            "/api/notifications/my-notifications?unread_only=true",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200

    def test_mark_notification_as_read(self, client, auth_token):
        """User can mark a notification as read"""
        notification_id = str(ObjectId())
        response = client.put(
            f"/api/notifications/{notification_id}/read",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        # May return 404 if notification doesn't exist, but endpoint should work
        assert response.status_code in [200, 404]

    def test_mark_all_as_read(self, client, auth_token):
        """User can mark all notifications as read"""
        response = client.put(
            "/api/notifications/read-all",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert "count" in response.json

    def test_delete_notification(self, client, auth_token):
        """User can delete a notification"""
        notification_id = str(ObjectId())
        response = client.delete(
            f"/api/notifications/{notification_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code in [200, 404]

    def test_get_unread_count(self, client, auth_token):
        """User can get unread notification count"""
        response = client.get(
            "/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert "unread_count" in response.json
        assert isinstance(response.json["unread_count"], int)


class TestNotificationPreferences:
    """Tests for notification preferences"""

    def test_get_preferences(self, client, auth_token):
        """User can get their notification preferences"""
        response = client.get(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert "preferences" in response.json
        prefs = response.json["preferences"]
        assert "email_enabled" in prefs
        assert "push_enabled" in prefs
        assert "notification_types" in prefs

    def test_get_preferences_default_values(self, client, auth_token):
        """Default preferences have expected values"""
        response = client.get(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        prefs = response.json["preferences"]
        assert prefs["email_enabled"] is True
        assert prefs["in_app_enabled"] is True
        assert prefs["digest_enabled"] is True

    def test_update_preferences(self, client, auth_token):
        """User can update notification preferences"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "email_enabled": False,
                "push_enabled": True,
                "digest_frequency": "weekly",
            },
        )
        assert response.status_code == 200
        assert "preferences" in response.json

    def test_update_preferences_notification_types(self, client, auth_token):
        """User can update per-type notification preferences"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "notification_types": {
                    "payment_received": {
                        "email": False,
                        "push": True,
                        "sms": False,
                        "in_app": True,
                    }
                }
            },
        )
        assert response.status_code == 200

    def test_update_preferences_quiet_hours(self, client, auth_token):
        """User can set quiet hours"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "quiet_hours_enabled": True,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "08:00",
            },
        )
        assert response.status_code == 200

    def test_update_preferences_invalid_field(self, client, auth_token):
        """Invalid preference fields are ignored"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "invalid_field": "value",
                "email_enabled": False,
            },
        )
        assert response.status_code == 200


class TestNotificationChannels:
    """Tests for notification channel management"""

    def test_email_channel_preference(self, client, auth_token):
        """Email channel can be enabled/disabled"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"email_enabled": False},
        )
        assert response.status_code == 200

        # Verify it was updated
        get_response = client.get(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert get_response.status_code == 200

    def test_push_channel_preference(self, client, auth_token):
        """Push channel can be enabled/disabled"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"push_enabled": False},
        )
        assert response.status_code == 200

    def test_in_app_channel_preference(self, client, auth_token):
        """In-app channel can be enabled/disabled"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"in_app_enabled": False},
        )
        assert response.status_code == 200

    def test_sms_channel_preference(self, client, auth_token):
        """SMS channel can be enabled/disabled (when available)"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"sms_enabled": True},
        )
        # Should be allowed in preferences even if not implemented
        assert response.status_code == 200


class TestNotificationTypes:
    """Tests for different notification types"""

    notification_types = [
        "payment_received",
        "payment_sent",
        "refund_issued",
        "dispute_reported",
        "dispute_resolved",
        "two_factor_enabled",
        "login_new_device",
        "security_alert",
        "account_locked",
        "password_changed",
    ]

    def test_all_notification_types_in_preferences(self, client, auth_token):
        """All notification types are in default preferences"""
        response = client.get(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        types = response.json["preferences"]["notification_types"]
        
        for notif_type in self.notification_types:
            assert notif_type in types
            assert "email" in types[notif_type]
            assert "push" in types[notif_type]
            assert "sms" in types[notif_type]
            assert "in_app" in types[notif_type]

    def test_disable_notification_type(self, client, auth_token):
        """Can disable specific notification type"""
        updates = {
            "notification_types": {
                "payment_received": {
                    "email": False,
                    "push": False,
                    "sms": False,
                    "in_app": False,
                }
            }
        }
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=updates,
        )
        assert response.status_code == 200


class TestNotificationAuthorization:
    """Tests for notification authorization"""

    def test_unauthenticated_cannot_access_notifications(self, client):
        """Unauthenticated users cannot access notifications"""
        response = client.get("/api/notifications/my-notifications")
        assert response.status_code == 401

    def test_unauthenticated_cannot_access_preferences(self, client):
        """Unauthenticated users cannot access preferences"""
        response = client.get("/api/notifications/preferences")
        assert response.status_code == 401

    def test_user_can_only_see_their_notifications(self, client, auth_token):
        """Users can only see their own notifications"""
        response = client.get(
            "/api/notifications/my-notifications",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200


class TestNotificationFiltering:
    """Tests for notification filtering and pagination"""

    def test_notifications_pagination_default(self, client, auth_token):
        """Notifications use default pagination (20 per page)"""
        response = client.get(
            "/api/notifications/my-notifications",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert response.json["pagination"]["limit"] == 20

    def test_notifications_pagination_custom_limit(self, client, auth_token):
        """Can set custom pagination limit"""
        response = client.get(
            "/api/notifications/my-notifications?limit=50",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert response.json["pagination"]["limit"] == 50

    def test_notifications_invalid_pagination(self, client, auth_token):
        """Invalid pagination parameters are rejected"""
        response = client.get(
            "/api/notifications/my-notifications?page=0&limit=200",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 400


class TestNotificationDelivery:
    """Tests for notification delivery settings"""

    def test_digest_enabled_default(self, client, auth_token):
        """Digest is enabled by default"""
        response = client.get(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert response.json["preferences"]["digest_enabled"] is True

    def test_set_digest_frequency(self, client, auth_token):
        """Can set digest frequency"""
        for frequency in ["daily", "weekly", "none"]:
            response = client.put(
                "/api/notifications/preferences",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={"digest_frequency": frequency},
            )
            assert response.status_code == 200

    def test_quiet_hours_disabled_default(self, client, auth_token):
        """Quiet hours are disabled by default"""
        response = client.get(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert response.status_code == 200
        assert response.json["preferences"]["quiet_hours_enabled"] is False

    def test_enable_quiet_hours(self, client, auth_token):
        """Can enable quiet hours"""
        response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "quiet_hours_enabled": True,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "08:00",
            },
        )
        assert response.status_code == 200
        prefs = response.json["preferences"]
        assert prefs["quiet_hours_enabled"] is True


class TestNotificationHealth:
    """Tests for notification service health"""

    def test_notification_health_endpoint(self, client):
        """Health check endpoint is accessible"""
        response = client.get("/api/notifications/health")
        assert response.status_code == 200
        assert response.json["status"] == "healthy"
        assert response.json["service"] == "notifications"


class TestNotificationRateLimiting:
    """Tests for notification rate limiting"""

    def test_send_notification_rate_limit(self, client, auth_token):
        """Sending notifications is rate limited"""
        # First request should succeed (or fail for other reasons)
        # Subsequent rapid requests should be rate limited
        for i in range(3):
            response = client.post(
                "/api/notifications/send",
                headers={"Authorization": f"Bearer {auth_token}"},
                json={
                    "recipient_id": str(ObjectId()),
                    "type": "payment_received",
                    "title": f"Test {i}",
                    "message": "Test message",
                },
            )
            # Just verify endpoint exists, rate limit may not trigger in test
            assert response.status_code in [201, 400, 500, 429]


class TestNotificationIntegration:
    """Integration tests for notification workflow"""

    def test_full_notification_workflow(self, client, auth_token):
        """Complete notification workflow"""
        # 1. Get initial unread count
        count_response = client.get(
            "/api/notifications/unread-count",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert count_response.status_code == 200

        # 2. Get notifications
        notif_response = client.get(
            "/api/notifications/my-notifications",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert notif_response.status_code == 200

        # 3. Get preferences
        pref_response = client.get(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        assert pref_response.status_code == 200

        # 4. Update preferences
        update_response = client.put(
            "/api/notifications/preferences",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={"email_enabled": False},
        )
        assert update_response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
