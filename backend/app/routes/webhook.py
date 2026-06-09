"""Paystack webhook handling for payment verification."""

import hmac
import hashlib
import json
import logging
from datetime import datetime

from flask import Blueprint, request, jsonify

from ..config import settings
from ..db import donations_col, coffee_col
from ..services.paystack import verify_payment
from ..services.payment_settlement import settle_by_reference

webhook_bp = Blueprint("webhook", __name__)
logger = logging.getLogger(__name__)


def verify_paystack_signature(payload, signature):
    """Verify Paystack webhook signature for security."""
    secret = settings.PAYSTACK_SECRET_KEY.encode("utf-8")
    computed_signature = hmac.new(secret, payload, hashlib.sha512).hexdigest()
    return hmac.compare_digest(computed_signature, signature)


def _parse_verified_at(event_data):
    paid_at = event_data.get("paid_at")
    if not paid_at:
        return datetime.utcnow()
    if isinstance(paid_at, datetime):
        return paid_at
    try:
        return datetime.fromisoformat(str(paid_at).replace("Z", "+00:00")).replace(tzinfo=None)
    except (TypeError, ValueError):
        return datetime.utcnow()


@webhook_bp.route("/paystack", methods=["POST"])
def paystack_webhook():
    """Handle Paystack payment webhooks."""
    try:
        payload = request.get_data()
        signature = request.headers.get("X-Paystack-Signature")

        if not signature:
            logger.warning("Webhook received without signature")
            return jsonify({"status": "error", "message": "No signature"}), 400

        if not verify_paystack_signature(payload, signature):
            logger.warning("Invalid webhook signature")
            return jsonify({"status": "error", "message": "Invalid signature"}), 400

        data = json.loads(payload.decode("utf-8"))
        event = data.get("event")
        event_data = data.get("data", {})

        logger.info("Received Paystack webhook: %s", event)

        if event == "charge.success":
            return handle_successful_payment(event_data)
        if event == "charge.failed":
            return handle_failed_payment(event_data)

        logger.info("Ignored webhook event: %s", event)
        return jsonify({"status": "ignored"}), 200

    except Exception as e:
        logger.error("Webhook processing error: %s", e)
        return jsonify({"status": "error", "message": "Internal error"}), 500


def handle_successful_payment(event_data):
    """Process successful payment webhook using shared settlement logic."""
    try:
        reference = event_data.get("reference")
        if not reference:
            logger.error("No reference in successful payment webhook")
            return jsonify({"status": "error"}), 400

        verification = verify_payment(reference)
        if not verification.get("status") or verification.get("data", {}).get("status") != "success":
            logger.error("Payment verification failed for reference: %s", reference)
            return jsonify({"status": "error"}), 400

        verified_at = _parse_verified_at(event_data)
        result = settle_by_reference(
            reference,
            paystack_data=event_data,
            verified_at=verified_at,
        )

        if not result:
            logger.warning("No transaction found for reference: %s", reference)
            return jsonify({"status": "not_found"}), 200

        logger.info(
            "Webhook settled %s %s (already_settled=%s)",
            result["transaction_type"],
            reference,
            result["settlement"].get("already_settled"),
        )
        return jsonify({"status": "success", "settlement": result["settlement"]}), 200

    except Exception as e:
        logger.error("Error processing successful payment: %s", e)
        return jsonify({"status": "error"}), 500


def handle_failed_payment(event_data):
    """Process failed payment webhook."""
    try:
        reference = event_data.get("reference")
        if not reference:
            return jsonify({"status": "error"}), 400

        donations_col.update_one(
            {"reference": reference, "status": "pending"},
            {"$set": {"status": "failed", "paystack_data": event_data}},
        )

        coffee_col.update_one(
            {"reference": reference, "status": "pending"},
            {"$set": {"status": "failed", "paystack_data": event_data}},
        )

        logger.info("Payment failed: %s", reference)
        return jsonify({"status": "success"}), 200

    except Exception as e:
        logger.error("Error processing failed payment: %s", e)
        return jsonify({"status": "error"}), 500
