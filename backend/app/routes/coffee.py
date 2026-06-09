from flask import Blueprint, request, jsonify
from bson import ObjectId
import uuid
from datetime import datetime
from ..db import users_col, coffee_col, campaigns_col
from ..models.coffee import create_coffee_doc
from ..services.paystack import initialize_payment, verify_payment
from ..services.payment_settlement import settle_successful_transaction
from ..utils.auth_helpers import serialize_doc
from ..errors import ValidationError, NotFoundError, ExternalServiceError

coffee_bp = Blueprint("coffee", __name__)

COFFEE_PRICE_GHC = 5  # GH₵5 per coffee


@coffee_bp.route("/initiate", methods=["POST"])
def initiate_coffee():
    data = request.get_json()

    required = ["amount", "donor_name", "donor_email"]
    for field in required:
        if not data.get(field):
            raise ValidationError(f"{field} is required")

    try:
        amount = float(data["amount"])
    except (TypeError, ValueError):
        raise ValidationError("Amount must be a valid number")

    if amount <= 0:
        raise ValidationError("Amount must be greater than 0")

    # Find recipient - either from profile username or campaign slug
    recipient = None
    campaign = None
    recipient_id = None
    
    if data.get("campaign_slug"):
        # Campaign payment
        campaign = campaigns_col.find_one({"slug": data["campaign_slug"].lower()})
        if not campaign:
            raise NotFoundError("Campaign not found")
        recipient = users_col.find_one({"_id": ObjectId(campaign["owner_id"])})
        recipient_id = str(recipient["_id"])
    elif data.get("recipient_username"):
        # Profile payment
        recipient = users_col.find_one({"username": data["recipient_username"].lower()})
        if not recipient:
            raise NotFoundError("Recipient not found")
        recipient_id = str(recipient["_id"])
    else:
        raise ValidationError("Either recipient_username or campaign_slug is required")

    reference = f"cof_{uuid.uuid4().hex[:16]}"

    metadata = {
        "type": "coffee",
        "recipient_id": recipient_id,
        "amount": amount,
        "donor_name": data["donor_name"],
        "message": data.get("message", ""),
    }
    if data.get("campaign_slug"):
        metadata["campaign_slug"] = data["campaign_slug"]

    paystack_res = initialize_payment(
        email=data["donor_email"],
        amount_ghc=amount,
        reference=reference,
        metadata=metadata,
    )

    if not paystack_res.get("status"):
        raise ExternalServiceError("Paystack", paystack_res.get("message", "Payment initialization failed"))

    # Save pending coffee
    doc = create_coffee_doc(
        recipient_id=recipient_id,
        amount=amount,
        donor_name=data["donor_name"],
        donor_email=data["donor_email"],
        message=data.get("message", ""),
        reference=reference,
        status="pending",
        campaign_slug=data.get("campaign_slug"),
    )
    coffee_col.insert_one(doc)

    return jsonify({
        "authorization_url": paystack_res["data"]["authorization_url"],
        "reference": reference,
    }), 200


@coffee_bp.route("/verify", methods=["POST"])
def verify_coffee():
    data = request.get_json()
    reference = data.get("reference")

    if not reference:
        raise ValidationError("Reference is required")

    coffee = coffee_col.find_one({"reference": reference})
    if not coffee:
        raise NotFoundError("Coffee transaction not found")

    if coffee.get("status") == "success" and coffee.get("settled_at"):
        recipient_id = coffee["recipient_id"]
        if isinstance(recipient_id, ObjectId):
            recipient_id = str(recipient_id)
        updated_user = users_col.find_one({"_id": ObjectId(recipient_id)})
        user_data = serialize_doc(updated_user) if updated_user else None
        if user_data:
            user_data.pop("password", None)
        updated_campaign = None
        if coffee.get("campaign_slug"):
            campaign = campaigns_col.find_one({"slug": coffee["campaign_slug"].lower()})
            if campaign:
                updated_campaign = serialize_doc(campaign)
        return jsonify({
            "message": "Already verified",
            "status": "success",
            "user": user_data,
            "campaign": updated_campaign,
        }), 200

    result = verify_payment(reference)

    if not result.get("status"):
        raise ExternalServiceError("Paystack", result.get("message", "Verification failed"))

    paystack_status = result["data"]["status"]

    if paystack_status == "success":
        settlement = settle_successful_transaction(coffee, "coffee")
        recipient_id = settlement.get("recipient_id") or coffee["recipient_id"]
        if isinstance(recipient_id, ObjectId):
            recipient_id = str(recipient_id)

        campaign_slug = coffee.get("campaign_slug")
        updated_campaign = None

        if campaign_slug:
            campaign = campaigns_col.find_one({"slug": campaign_slug.lower()})
            if campaign:
                updated_campaign = serialize_doc(campaign)
                if campaign.get("goal_amount", 0) > 0:
                    updated_campaign["percent_funded"] = min(
                        100,
                        round((campaign["amount_raised"] / campaign["goal_amount"]) * 100),
                    )

        updated_user = users_col.find_one({"_id": ObjectId(recipient_id)})
        user_data = serialize_doc(updated_user)
        user_data.pop("password", None)

        return jsonify({
            "message": "Coffee sent!",
            "status": "success",
            "settlement": settlement,
            "user": user_data,
            "campaign": updated_campaign,
        }), 200

    else:
        coffee_col.update_one(
            {"reference": reference},
            {"$set": {"status": "failed"}}
        )
        return jsonify({"message": "Payment was not successful", "status": "failed"}), 200


@coffee_bp.route("/recent", methods=["GET"])
def get_recent_coffees():
    """Get recent coffees received by authenticated user"""
    from flask_jwt_extended import jwt_required, get_jwt_identity
    
    jwt_required()
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise NotFoundError("User not found")
    
    page = request.args.get("page", 1, type=int)
    limit = 20
    skip = (page - 1) * limit
    
    coffees = list(coffee_col.find(
        {"recipient_id": user_id, "status": "success"}
    ).sort("created_at", -1).skip(skip).limit(limit))
    
    total = coffee_col.count_documents({"recipient_id": user_id, "status": "success"})
    
    return jsonify({
        "coffees": [serialize_doc(c) for c in coffees],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }), 200


@coffee_bp.route("/stats", methods=["GET"])
def get_coffee_stats():
    """Get coffee statistics for authenticated user"""
    from flask_jwt_extended import jwt_required, get_jwt_identity
    
    jwt_required()
    user_id = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise NotFoundError("User not found")
    
    stats = list(coffee_col.aggregate([
        {"$match": {"recipient_id": user_id, "status": "success"}},
        {
            "$group": {
                "_id": None,
                "total_amount": {"$sum": "$amount"},
                "count": {"$sum": 1},
                "total_cups": {"$sum": "$cups"}
            }
        }
    ]))
    
    if stats:
        return jsonify({
            "stats": {
                "coffee_total": stats[0].get("total_amount", 0),
                "coffee_count": stats[0].get("count", 0),
                "total_cups": stats[0].get("total_cups", 0)
            }
        }), 200
    
    return jsonify({
        "stats": {
            "coffee_total": 0,
            "coffee_count": 0,
            "total_cups": 0
        }
    }), 200