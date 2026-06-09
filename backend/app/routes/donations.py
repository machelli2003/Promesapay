from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from bson import ObjectId
import uuid
from datetime import datetime
from ..db import users_col, donations_col, campaigns_col
from ..models.donation import create_donation_doc
from ..services.paystack import initialize_payment, verify_payment
from ..services.payment_settlement import settle_successful_transaction
from ..utils.auth_helpers import serialize_doc
from ..errors import ValidationError, NotFoundError, ExternalServiceError

donations_bp = Blueprint("donations", __name__)


@donations_bp.route("/initiate", methods=["POST"])
def initiate_donation():
    data = request.get_json()

    required = ["amount", "donor_name", "donor_email"]
    if not data.get("campaign_slug"):
        required.append("recipient_username")
    for field in required:
        if not data.get(field):
            raise ValidationError(f"{field} is required")

    try:
        amount = float(data["amount"])
    except (TypeError, ValueError):
        raise ValidationError("Amount must be a valid number")

    if amount < 1:
        raise ValidationError("Minimum donation is GH₵1")

    campaign_id = None
    campaign = None

    if data.get("campaign_slug"):
        campaign = campaigns_col.find_one({"slug": data["campaign_slug"].lower()})
        if not campaign:
            raise NotFoundError("Campaign not found")
        if campaign.get("status") != "active":
            raise ValidationError("This campaign is not accepting donations")
        recipient = users_col.find_one({"_id": ObjectId(campaign["owner_id"])})
        campaign_id = str(campaign["_id"])
    else:
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
    if campaign_id:
        metadata["campaign_id"] = campaign_id

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
        campaign_id=campaign_id,
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

    if donation.get("status") == "success" and donation.get("settled_at"):
        recipient_id = donation["recipient_id"]
        updated_user = users_col.find_one({"_id": ObjectId(recipient_id)})
        user_data = serialize_doc(updated_user) if updated_user else None
        if user_data:
            user_data.pop("password", None)
        updated_campaign = None
        if donation.get("campaign_id"):
            camp = campaigns_col.find_one({"_id": ObjectId(donation["campaign_id"])})
            if camp:
                updated_campaign = serialize_doc(camp)
        return jsonify({
            "message": "Already verified",
            "status": "success",
            "user": user_data,
            "campaign": updated_campaign,
        }), 200

    # Verify with Paystack
    result = verify_payment(reference)

    if not result.get("status"):
        raise ExternalServiceError("Paystack", result.get("message", "Verification failed"))

    paystack_status = result["data"]["status"]

    if paystack_status == "success":
        settlement = settle_successful_transaction(donation, "donation")
        recipient_id = settlement.get("recipient_id") or donation["recipient_id"]

        campaign_id = donation.get("campaign_id")
        updated_campaign = None
        if campaign_id:
            camp = campaigns_col.find_one({"_id": ObjectId(campaign_id)})
            if camp:
                updated_campaign = serialize_doc(camp)
                if camp.get("goal_amount", 0) > 0:
                    updated_campaign["percent_funded"] = min(
                        100,
                        round((camp["amount_raised"] / camp["goal_amount"]) * 100),
                    )

        updated_user = users_col.find_one({"_id": ObjectId(recipient_id)})
        user_data = serialize_doc(updated_user)
        user_data.pop("password", None)

        return jsonify({
            "message": "Donation verified!",
            "status": "success",
            "settlement": settlement,
            "user": user_data,
            "campaign": updated_campaign,
        }), 200

    else:
        donations_col.update_one(
            {"reference": reference},
            {"$set": {"status": "failed"}}
        )
        return jsonify({"message": "Payment was not successful", "status": "failed"}), 200