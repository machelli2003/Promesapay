from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from bson import ObjectId
import uuid
from datetime import datetime
from ..db import users_col, donations_col
from ..models.donation import create_donation_doc
from ..services.paystack import initialize_payment, verify_payment
from ..utils.auth_helpers import serialize_doc
from ..errors import ValidationError, NotFoundError, ExternalServiceError

donations_bp = Blueprint("donations", __name__)


@donations_bp.route("/initiate", methods=["POST"])
def initiate_donation():
    data = request.get_json()

    required = ["recipient_username", "amount", "donor_name", "donor_email"]
    for field in required:
        if not data.get(field):
            raise ValidationError(f"{field} is required")

    try:
        amount = float(data["amount"])
    except (TypeError, ValueError):
        raise ValidationError("Amount must be a valid number")

    if amount < 1:
        raise ValidationError("Minimum donation is GH₵1")

    # Find recipient
    recipient = users_col.find_one({"username": data["recipient_username"].lower()})
    if not recipient:
        raise NotFoundError("Recipient not found")

    recipient_id = str(recipient["_id"])
    reference = f"don_{uuid.uuid4().hex[:16]}"

    # Initialize Paystack
    metadata = {
        "type": "donation",
        "recipient_id": recipient_id,
        "donor_name": data["donor_name"],
        "message": data.get("message", ""),
    }

    paystack_res = initialize_payment(
        email=data["donor_email"],
        amount_ghc=amount,
        reference=reference,
        metadata=metadata,
    )

    if not paystack_res.get("status"):
        raise ExternalServiceError("Paystack", paystack_res.get("message", "Payment initialization failed"))

    # Save pending donation
    doc = create_donation_doc(
        recipient_id=recipient_id,
        amount=amount,
        donor_name=data["donor_name"],
        donor_email=data["donor_email"],
        message=data.get("message", ""),
        reference=reference,
        status="pending",
    )
    donations_col.insert_one(doc)

    return jsonify({
        "authorization_url": paystack_res["data"]["authorization_url"],
        "reference": reference,
    }), 200


@donations_bp.route("/verify", methods=["POST"])
def verify_donation():
    data = request.get_json()
    reference = data.get("reference")

    if not reference:
        raise ValidationError("Reference is required")

    # Find pending donation
    donation = donations_col.find_one({"reference": reference})
    if not donation:
        raise NotFoundError("Donation not found")

    if donation["status"] == "success":
        return jsonify({"message": "Already verified", "status": "success"}), 200

    # Verify with Paystack
    result = verify_payment(reference)

    if not result.get("status"):
        raise ExternalServiceError("Paystack", result.get("message", "Verification failed"))

    paystack_status = result["data"]["status"]

    if paystack_status == "success":
        amount = donation["amount"]
        recipient_id = donation["recipient_id"]

        # Update donation status
        donations_col.update_one(
            {"reference": reference},
            {"$set": {"status": "success", "verified_at": datetime.utcnow()}}
        )

        # Update user total_received
        users_col.update_one(
            {"_id": ObjectId(recipient_id)},
            {"$inc": {"total_received": amount}}
        )

        # Fetch updated profile
        updated_user = users_col.find_one({"_id": ObjectId(recipient_id)})
        user_data = serialize_doc(updated_user)
        user_data.pop("password", None)

        return jsonify({"message": "Donation verified!", "status": "success", "user": user_data}), 200

    else:
        donations_col.update_one(
            {"reference": reference},
            {"$set": {"status": "failed"}}
        )
        return jsonify({"message": "Payment was not successful", "status": "failed"}), 200