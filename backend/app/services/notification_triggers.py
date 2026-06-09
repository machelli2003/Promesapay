"""
Notification Triggers
Automatically sends notifications when specific events occur
"""

from app.services.notifications import notification_service


def trigger_payment_received(recipient_id, donor_name, amount, currency="USD", transaction_id=None):
    """Triggered when user receives a donation/coffee payment"""
    try:
        notification_service.send_notification(
            user_id=recipient_id,
            notification_type="payment_received",
            title=f"Payment Received from {donor_name}",
            message=f"You received {currency} {amount} from {donor_name}",
            action_url=f"/financial" if not transaction_id else f"/financial?tx={transaction_id}",
            data={
                "amount": amount,
                "currency": currency,
                "sender": donor_name,
                "transaction_id": str(transaction_id) if transaction_id else None
            },
            priority="high"
        )
    except Exception as e:
        print(f"Error sending payment_received notification: {e}")


def trigger_payment_sent(sender_id, recipient_name, amount, currency="USD", transaction_id=None):
    """Triggered when user sends money to someone"""
    try:
        notification_service.send_notification(
            user_id=sender_id,
            notification_type="payment_sent",
            title=f"Payment Sent to {recipient_name}",
            message=f"You sent {currency} {amount} to {recipient_name}",
            action_url=f"/financial" if not transaction_id else f"/financial?tx={transaction_id}",
            data={
                "amount": amount,
                "currency": currency,
                "recipient": recipient_name,
                "transaction_id": str(transaction_id) if transaction_id else None
            },
            priority="normal"
        )
    except Exception as e:
        print(f"Error sending payment_sent notification: {e}")


def trigger_refund_issued(recipient_id, amount, currency="USD", reason="Refund processed", transaction_id=None):
    """Triggered when admin issues a refund"""
    try:
        notification_service.send_notification(
            user_id=recipient_id,
            notification_type="refund_issued",
            title="Refund Issued",
            message=f"A refund of {currency} {amount} has been issued. Reason: {reason}",
            action_url="/financial",
            data={
                "amount": amount,
                "currency": currency,
                "reason": reason,
                "transaction_id": str(transaction_id) if transaction_id else None
            },
            priority="high"
        )
    except Exception as e:
        print(f"Error sending refund_issued notification: {e}")


def trigger_dispute_reported(user_id, dispute_id, other_party_name, transaction_amount):
    """Triggered when a dispute is opened"""
    try:
        notification_service.send_notification(
            user_id=user_id,
            notification_type="dispute_reported",
            title="Dispute Report Received",
            message=f"Your dispute regarding a {transaction_amount} transaction with {other_party_name} has been received",
            action_url=f"/disputes/my-disputes",
            data={
                "dispute_id": str(dispute_id),
                "other_party": other_party_name,
                "amount": transaction_amount
            },
            priority="high"
        )
    except Exception as e:
        print(f"Error sending dispute_reported notification: {e}")


def trigger_dispute_resolved(user_id, dispute_id, resolution, refund_amount=None):
    """Triggered when a dispute is resolved"""
    try:
        message = f"Your dispute has been resolved: {resolution}"
        if refund_amount:
            message += f". Refund: ${refund_amount}"
        
        notification_service.send_notification(
            user_id=user_id,
            notification_type="dispute_resolved",
            title="Dispute Resolved",
            message=message,
            action_url="/disputes/my-disputes",
            data={
                "dispute_id": str(dispute_id),
                "resolution": resolution,
                "refund_amount": refund_amount
            },
            priority="high"
        )
    except Exception as e:
        print(f"Error sending dispute_resolved notification: {e}")


def trigger_security_alert(user_id, alert_type, description, ip_address=None, device_info=None):
    """Triggered for security events"""
    try:
        notification_service.send_notification(
            user_id=user_id,
            notification_type="security_alert",
            title=f"Security Alert: {alert_type}",
            message=description,
            action_url="/edit-profile",
            data={
                "alert_type": alert_type,
                "ip_address": ip_address,
                "device_info": device_info
            },
            priority="critical",
            channels=["email", "push", "sms", "in_app"]  # Force all channels for security
        )
    except Exception as e:
        print(f"Error sending security_alert notification: {e}")


def trigger_login_new_device(user_id, device_name=None, ip_address=None, location=None):
    """Triggered when user logs in from new device"""
    try:
        device_desc = device_name or f"Device at {ip_address}" if ip_address else "New Device"
        location_desc = f" in {location}" if location else ""
        
        notification_service.send_notification(
            user_id=user_id,
            notification_type="login_new_device",
            title="New Login Detected",
            message=f"Your account was accessed from {device_desc}{location_desc}. If this wasn't you, please secure your account immediately.",
            action_url="/edit-profile",
            data={
                "device_name": device_name,
                "ip_address": ip_address,
                "location": location
            },
            priority="high",
            channels=["email", "push", "sms", "in_app"]
        )
    except Exception as e:
        print(f"Error sending login_new_device notification: {e}")


def trigger_account_locked(user_id, reason="Too many failed login attempts"):
    """Triggered when account is locked"""
    try:
        notification_service.send_notification(
            user_id=user_id,
            notification_type="account_locked",
            title="Account Locked",
            message=f"Your account has been locked for security reasons: {reason}. Please contact support or reset your password.",
            action_url="/forgot-password",
            data={
                "reason": reason,
                "support_link": "/support"
            },
            priority="critical",
            channels=["email", "push", "sms", "in_app"]
        )
    except Exception as e:
        print(f"Error sending account_locked notification: {e}")


def trigger_password_changed(user_id):
    """Triggered when user changes password"""
    try:
        notification_service.send_notification(
            user_id=user_id,
            notification_type="password_changed",
            title="Password Changed",
            message="Your account password was successfully changed. If you didn't make this change, please contact support immediately.",
            action_url="/edit-profile",
            data={
                "timestamp": None,
                "support_link": "/support"
            },
            priority="normal",
            channels=["email", "in_app"]  # Don't use push/sms for password changes
        )
    except Exception as e:
        print(f"Error sending password_changed notification: {e}")


# Example usage in other modules:
# from app.services.notification_triggers import trigger_payment_received
# trigger_payment_received(
#     recipient_id=user_id,
#     donor_name="John Doe",
#     amount=50,
#     currency="USD",
#     transaction_id=transaction._id
# )
