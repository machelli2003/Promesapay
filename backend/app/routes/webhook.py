"""Paystack webhook handling for payment verification."""

import hmac
import hashlib
import json
from flask import Blueprint, request, jsonify, current_app
from ..db import donations_col, coffee_col, users_col
from ..services.paystack import verify_payment
from ..config import settings
import logging

webhook_bp = Blueprint("webhook", __name__)

def verify_paystack_signature(payload, signature):
    """Verify Paystack webhook signature for security."""
    secret = settings.PAYSTACK_SECRET_KEY.encode('utf-8')
    computed_signature = hmac.new(secret, payload, hashlib.sha512).hexdigest()
    return hmac.compare_digest(computed_signature, signature)

@webhook_bp.route("/paystack", methods=["POST"])
def paystack_webhook():
    """Handle Paystack payment webhooks."""
    try:
        # Get raw payload and signature
        payload = request.get_data()
        signature = request.headers.get('X-Paystack-Signature')

        if not signature:
            logging.warning("Webhook received without signature")
            return jsonify({"status": "error", "message": "No signature"}), 400

        # Verify signature
        if not verify_paystack_signature(payload, signature):
            logging.warning("Invalid webhook signature")
            return jsonify({"status": "error", "message": "Invalid signature"}), 400

        # Parse payload
        data = json.loads(payload.decode('utf-8'))
        event = data.get('event')
        event_data = data.get('data', {})

        logging.info(f"Received Paystack webhook: {event}")

        if event == 'charge.success':
            return handle_successful_payment(event_data)
        elif event == 'charge.failed':
            return handle_failed_payment(event_data)
        else:
            logging.info(f"Ignored webhook event: {event}")
            return jsonify({"status": "ignored"}), 200

    except Exception as e:
        logging.error(f"Webhook processing error: {str(e)}")
        return jsonify({"status": "error", "message": "Internal error"}), 500

def handle_successful_payment(event_data):
    """Process successful payment webhook."""
    try:
        reference = event_data.get('reference')
        amount_paid = event_data.get('amount') / 100  # Convert from pesewas to GHC
        customer_email = event_data.get('customer', {}).get('email')

        if not reference:
            logging.error("No reference in successful payment webhook")
            return jsonify({"status": "error"}), 400

        # Verify payment with Paystack API
        verification = verify_payment(reference)
        if not verification.get('status') or verification.get('data', {}).get('status') != 'success':
            logging.error(f"Payment verification failed for reference: {reference}")
            return jsonify({"status": "error"}), 400

        # Find and update the transaction
        transaction = donations_col.find_one_and_update(
            {"reference": reference, "status": "pending"},
            {
                "$set": {
                    "status": "completed",
                    "paystack_data": event_data,
                    "verified_at": event_data.get('paid_at')
                }
            },
            return_document=True
        )

        if transaction:
            # Update creator's wallet balance
            creator_id = transaction.get('creator_id')
            if creator_id:
                amount_earned = transaction.get('amount', 0)
                update_creator_balance(creator_id, amount_earned)

            # Update user's transaction count
            user_id = transaction.get('user_id')
            if user_id:
                users_col.update_one(
                    {"_id": user_id},
                    {"$inc": {"total_donations": 1}}
                )

            logging.info(f"Donation completed: {reference}")
            return jsonify({"status": "success"}), 200

        # Check coffee purchases
        coffee_transaction = coffee_col.find_one_and_update(
            {"reference": reference, "status": "pending"},
            {
                "$set": {
                    "status": "completed",
                    "paystack_data": event_data,
                    "verified_at": event_data.get('paid_at')
                }
            },
            return_document=True
        )

        if coffee_transaction:
            # Update creator's wallet balance
            creator_id = coffee_transaction.get('creator_id')
            if creator_id:
                amount_earned = coffee_transaction.get('amount', 0)
                update_creator_balance(creator_id, amount_earned)

            logging.info(f"Coffee purchase completed: {reference}")
            return jsonify({"status": "success"}), 200

        logging.warning(f"No pending transaction found for reference: {reference}")
        return jsonify({"status": "not_found"}), 200

    except Exception as e:
        logging.error(f"Error processing successful payment: {str(e)}")
        return jsonify({"status": "error"}), 500

def handle_failed_payment(event_data):
    """Process failed payment webhook."""
    try:
        reference = event_data.get('reference')

        if not reference:
            return jsonify({"status": "error"}), 400

        # Update transaction status to failed
        donations_col.update_one(
            {"reference": reference},
            {"$set": {"status": "failed", "paystack_data": event_data}}
        )

        coffee_col.update_one(
            {"reference": reference},
            {"$set": {"status": "failed", "paystack_data": event_data}}
        )

        logging.info(f"Payment failed: {reference}")
        return jsonify({"status": "success"}), 200

    except Exception as e:
        logging.error(f"Error processing failed payment: {str(e)}")
        return jsonify({"status": "error"}), 500

def update_creator_balance(creator_id, amount):
    """Update creator's wallet balance."""
    try:
        users_col.update_one(
            {"_id": creator_id},
            {
                "$inc": {
                    "wallet_balance": amount,
                    "total_earned": amount
                }
            }
        )
        logging.info(f"Updated balance for creator {creator_id}: +{amount} GHC")
    except Exception as e:
        logging.error(f"Error updating creator balance: {str(e)}")