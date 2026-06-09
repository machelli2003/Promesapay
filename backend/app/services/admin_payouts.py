"""Admin payout queue: list, stats, and status transitions with wallet refunds."""

import logging
from datetime import datetime

from bson import ObjectId

from ..db import payouts_col, users_col, activity_log_col
from ..services.paystack import create_transfer_recipient, initiate_transfer

logger = logging.getLogger(__name__)

VALID_TRANSITIONS = {
    "pending": {"processing", "failed", "cancelled"},
    "processing": {"completed", "failed"},
}

REFUND_STATUSES = frozenset({"failed", "cancelled"})


class PayoutStatusError(ValueError):
    """Invalid payout status transition or payout state."""


def _serialize_payout(payout, user=None):
    doc = dict(payout)
    doc["_id"] = str(doc["_id"])
    doc["user_id"] = str(doc["user_id"])
    if doc.get("payment_method_id"):
        doc["payment_method_id"] = str(doc["payment_method_id"])
    if doc.get("processed_by"):
        doc["processed_by"] = str(doc["processed_by"])
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    if isinstance(doc.get("updated_at"), datetime):
        doc["updated_at"] = doc["updated_at"].isoformat()
    if isinstance(doc.get("processed_at"), datetime):
        doc["processed_at"] = doc["processed_at"].isoformat()
    if user:
        doc["user"] = {
            "_id": str(user["_id"]),
            "username": user.get("username", ""),
            "email": user.get("email", ""),
            "full_name": user.get("full_name", ""),
        }
    return doc


def _log_admin_action(admin_id, action, details):
    activity_log_col.insert_one(
        {
            "_id": ObjectId(),
            "action": action,
            "admin_id": ObjectId(admin_id),
            "details": details,
            "timestamp": datetime.utcnow(),
        }
    )


def _process_paystack_transfer(payout):
    if payout.get("payment_method_provider") != "paystack":
        return None

    account_info = payout.get("account_details", {})
    recipient_name = account_info.get("account_name") or account_info.get("full_name")
    recipient_result = create_transfer_recipient(
        account_info=account_info,
        method_type=payout.get("payment_method_type"),
        provider=payout.get("payment_method_provider"),
        recipient_name=recipient_name,
    )
    if not recipient_result.get("status"):
        raise PayoutStatusError(
            f"Paystack recipient creation failed: {recipient_result.get('message', 'Unknown error')}"
        )

    recipient_code = recipient_result.get("data", {}).get("recipient_code")
    if not recipient_code:
        raise PayoutStatusError("Paystack recipient creation did not return a recipient code.")

    transfer_result = initiate_transfer(
        payout["amount"],
        recipient_code,
        reason=f"Creator payout {str(payout['_id'])}",
    )
    if not transfer_result.get("status"):
        raise PayoutStatusError(
            f"Paystack transfer failed: {transfer_result.get('message', 'Unknown error')}"
        )

    transfer_data = transfer_result.get("data", {})
    reference = transfer_data.get("reference")
    if not reference:
        raise PayoutStatusError("Paystack transfer did not return a transfer reference.")

    return {
        "reference": reference,
        "transfer_status": transfer_data.get("status"),
        "transfer_data": transfer_data,
    }


def get_queue_stats():
    pending = list(payouts_col.find({"status": "pending"}))
    processing = list(payouts_col.find({"status": "processing"}))
    return {
        "pending_count": len(pending),
        "processing_count": len(processing),
        "pending_amount": sum(p.get("amount", 0) for p in pending),
        "processing_amount": sum(p.get("amount", 0) for p in processing),
    }


def list_payouts(*, status=None, page=1, per_page=20):
    query = {}
    if status and status != "all":
        query["status"] = status

    skip = (page - 1) * per_page
    cursor = (
        payouts_col.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(per_page)
    )
    payouts = list(cursor)
    total = payouts_col.count_documents(query)

    user_ids = list({p["user_id"] for p in payouts})
    users_by_id = {}
    if user_ids:
        for user in users_col.find({"_id": {"$in": user_ids}}):
            users_by_id[user["_id"]] = user

    items = [
        _serialize_payout(p, users_by_id.get(p["user_id"]))
        for p in payouts
    ]

    return {
        "payouts": items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": max(1, (total + per_page - 1) // per_page),
        },
    }


def get_payout_detail(payout_id):
    payout = payouts_col.find_one({"_id": ObjectId(payout_id)})
    if not payout:
        return None
    user = users_col.find_one({"_id": payout["user_id"]})
    return _serialize_payout(payout, user)


def update_payout_status(
    admin_id,
    payout_id,
    new_status,
    *,
    notes="",
    reference="",
    failure_reason="",
):
    payout = payouts_col.find_one({"_id": ObjectId(payout_id)})
    if not payout:
        raise PayoutStatusError("Payout not found")

    current = payout.get("status")
    allowed = VALID_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        raise PayoutStatusError(
            f"Cannot move payout from '{current}' to '{new_status}'"
        )

    now = datetime.utcnow()
    update_fields = {
        "status": new_status,
        "updated_at": now,
        "processed_by": ObjectId(admin_id),
    }
    if notes:
        update_fields["admin_notes"] = notes
    if new_status == "processing" and current == "pending" and payout.get("payment_method_provider") == "paystack":
        transfer_info = _process_paystack_transfer(payout)
        update_fields["reference"] = transfer_info["reference"]
        update_fields["transfer_status"] = transfer_info["transfer_status"]
        update_fields["transfer_data"] = transfer_info["transfer_data"]
    elif reference:
        update_fields["reference"] = reference
    if failure_reason and new_status == "failed":
        update_fields["failure_reason"] = failure_reason

    if new_status in ("completed", "failed"):
        update_fields["processed_at"] = now

    result = payouts_col.update_one(
        {"_id": ObjectId(payout_id), "status": current},
        {"$set": update_fields},
    )
    if result.modified_count == 0:
        raise PayoutStatusError("Payout status changed; refresh and try again")

    if new_status in REFUND_STATUSES:
        users_col.update_one(
            {"_id": payout["user_id"]},
            {"$inc": {"wallet_balance": payout["amount"]}},
        )
        logger.info(
            "Refunded GH₵%.2f to user %s for payout %s (%s)",
            payout["amount"],
            payout["user_id"],
            payout_id,
            new_status,
        )

    _log_admin_action(
        admin_id,
        "payout_status_updated",
        {
            "payout_id": payout_id,
            "from_status": current,
            "to_status": new_status,
            "amount": payout.get("amount"),
            "user_id": str(payout["user_id"]),
            "refunded": new_status in REFUND_STATUSES,
        },
    )

    return get_payout_detail(payout_id)
