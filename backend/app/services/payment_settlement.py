"""Settle successful Paystack payments: fee split, creator wallet, platform revenue."""

import logging
from datetime import datetime

from bson import ObjectId

from ..db import users_col, donations_col, coffee_col, campaigns_col, platform_revenue_col
from ..models.platform_revenue import create_platform_revenue_doc
from .payment_fees import calculate_fee_split
from .receipt_service import ensure_receipt_for_transaction

logger = logging.getLogger(__name__)

COLLECTION_BY_TYPE = {
    "donation": donations_col,
    "coffee": coffee_col,
    # Support legacy/external "coffee" type while allowing internal code
    # to refer to "doll". Both map to the same collection.
    "doll": coffee_col,
}


def _normalize_recipient_id(recipient_id):
    if recipient_id is None:
        return None
    if isinstance(recipient_id, ObjectId):
        return str(recipient_id)
    return str(recipient_id)


def _is_already_settled(transaction):
    return transaction.get("settled_at") is not None


def _settlement_snapshot(transaction, fees=None):
    if fees:
        return {
            "already_settled": True,
            "reference": transaction.get("reference"),
            "gross_amount": fees["gross_amount"],
            "paystack_fee": fees["paystack_fee"],
            "platform_fee": fees["platform_fee"],
            "creator_earnings": fees["creator_earnings"],
        }
    return {
        "already_settled": True,
        "reference": transaction.get("reference"),
        "gross_amount": transaction.get("gross_amount", transaction.get("amount")),
        "paystack_fee": transaction.get("paystack_fee"),
        "platform_fee": transaction.get("platform_fee"),
        "creator_earnings": transaction.get("creator_earnings"),
    }


def settle_successful_transaction(
    transaction,
    transaction_type,
    *,
    paystack_data=None,
    verified_at=None,
):
    """
    Apply fee split and credit creator wallet. Idempotent if already settled.

    Returns dict with fee breakdown and whether settlement was newly applied.
    """
    # Normalize aliases: allow callers to use "doll" internally but
    # persist and report using the canonical "coffee" transaction type.
    if transaction_type == "doll":
        transaction_type = "coffee"

    if transaction_type not in COLLECTION_BY_TYPE:
        raise ValueError(f"Invalid transaction_type: {transaction_type}")

    collection = COLLECTION_BY_TYPE[transaction_type]
    reference = transaction.get("reference")

    if _is_already_settled(transaction):
        updated = collection.find_one({"_id": transaction["_id"]}) or transaction
        ensure_receipt_for_transaction(updated, transaction_type)
        return _settlement_snapshot(transaction)

    recipient_id = _normalize_recipient_id(transaction.get("recipient_id"))
    if not recipient_id:
        raise ValueError(f"Transaction {reference} has no recipient_id")

    fees = calculate_fee_split(transaction.get("amount", 0))
    now = verified_at or datetime.utcnow()

    settlement_update = {
        "status": "success",
        "verified_at": now,
        "settled_at": now,
        "gross_amount": fees["gross_amount"],
        "paystack_fee": fees["paystack_fee"],
        "platform_fee": fees["platform_fee"],
        "creator_earnings": fees["creator_earnings"],
    }
    if paystack_data is not None:
        settlement_update["paystack_data"] = paystack_data

    result = collection.update_one(
        {"_id": transaction["_id"], "settled_at": {"$exists": False}},
        {"$set": settlement_update},
    )

    if result.modified_count == 0:
        existing = collection.find_one({"_id": transaction["_id"]})
        if existing:
            ensure_receipt_for_transaction(existing, transaction_type)
        return _settlement_snapshot(existing or transaction)

    creator_earnings = fees["creator_earnings"]

    users_col.update_one(
        {"_id": ObjectId(recipient_id)},
        {
            "$inc": {
                "wallet_balance": creator_earnings,
                "total_earned": creator_earnings,
                "total_received": creator_earnings,
            }
        },
    )

    if transaction_type == "donation":
        users_col.update_one(
            {"_id": ObjectId(recipient_id)},
            {"$inc": {"total_donations": 1}},
        )

    platform_revenue_col.insert_one(
        create_platform_revenue_doc(
            transaction_id=transaction["_id"],
            transaction_type=transaction_type,
            reference=reference,
            recipient_id=recipient_id,
            gross_amount=fees["gross_amount"],
            paystack_fee=fees["paystack_fee"],
            platform_fee=fees["platform_fee"],
            creator_earnings=creator_earnings,
        )
    )

    _update_campaign_totals(transaction, transaction_type, fees["gross_amount"])

    updated = collection.find_one({"_id": transaction["_id"]})
    ensure_receipt_for_transaction(updated or transaction, transaction_type)

    logger.info(
        "Settled %s %s: gross=%.2f net=%.2f platform_fee=%.2f recipient=%s",
        transaction_type,
        reference,
        fees["gross_amount"],
        creator_earnings,
        fees["platform_fee"],
        recipient_id,
    )

    return {
        "already_settled": False,
        "reference": reference,
        "recipient_id": recipient_id,
        **fees,
    }


def _update_campaign_totals(transaction, transaction_type, gross_amount):
    """Campaign goals track gross supporter payments."""
    if transaction_type == "donation":
        campaign_id = transaction.get("campaign_id")
        if campaign_id:
            campaigns_col.update_one(
                {"_id": ObjectId(campaign_id)},
                {"$inc": {"amount_raised": gross_amount, "donor_count": 1}},
            )
        return

    campaign_slug = transaction.get("campaign_slug")
    if campaign_slug:
        campaign = campaigns_col.find_one({"slug": campaign_slug.lower()})
        if campaign:
            campaigns_col.update_one(
                {"_id": campaign["_id"]},
                {"$inc": {"amount_raised": gross_amount, "donor_count": 1}},
            )


def settle_by_reference(reference, *, paystack_data=None, verified_at=None):
    """
    Settle a donation or coffee by Paystack reference.
    Returns {"transaction_type", "settlement"} or None if not found.
    """
    donation = donations_col.find_one({"reference": reference})
    if donation:
        return {
            "transaction_type": "donation",
            "settlement": settle_successful_transaction(
                donation,
                "donation",
                paystack_data=paystack_data,
                verified_at=verified_at,
            ),
        }

    coffee = coffee_col.find_one({"reference": reference})
    if coffee:
        return {
            "transaction_type": "coffee",
            "settlement": settle_successful_transaction(
                coffee,
                "coffee",
                paystack_data=paystack_data,
                verified_at=verified_at,
            ),
        }

    return None
