"""Create and ensure receipts exist for settled transactions."""

import logging
import random
from datetime import datetime

from bson import ObjectId

from ..db import receipts_col
from ..models.receipt import create_receipt_doc

logger = logging.getLogger(__name__)


def generate_receipt_number():
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    random_suffix = random.randint(1000, 9999)
    return f"REC-{timestamp}-{random_suffix}"


def _normalize_recipient_id(recipient_id):
    if recipient_id is None:
        return None
    if isinstance(recipient_id, ObjectId):
        return recipient_id
    return ObjectId(str(recipient_id))


def ensure_receipt_for_transaction(transaction, transaction_type):
    """
    Create a receipt for a successful transaction if one does not exist.
    Idempotent — safe to call after every settlement attempt.

    Returns the receipt document or None if the transaction is not receipt-ready.
    """
    if transaction_type not in ("donation", "coffee"):
        return None

    if transaction.get("status") != "success":
        return None

    transaction_id = transaction["_id"]
    existing = receipts_col.find_one({"transaction_id": transaction_id})
    if existing:
        return existing

    recipient_id = _normalize_recipient_id(transaction.get("recipient_id"))
    if not recipient_id:
        logger.warning("Skipping receipt: missing recipient_id for %s", transaction_id)
        return None

    amount = transaction.get("gross_amount", transaction.get("amount", 0))

    receipt_doc = create_receipt_doc(
        transaction_id=transaction_id,
        transaction_type=transaction_type,
        payer_name=transaction.get("donor_name", "Anonymous"),
        payer_email=transaction.get("donor_email", ""),
        recipient_id=recipient_id,
        amount=amount,
        currency="GHS",
        payment_reference=transaction.get("reference", ""),
        receipt_number=generate_receipt_number(),
    )

    try:
        receipts_col.insert_one(receipt_doc)
        logger.info(
            "Receipt %s created for %s %s",
            receipt_doc["receipt_number"],
            transaction_type,
            transaction.get("reference"),
        )
        return receipt_doc
    except Exception as e:
        # Concurrent settlement may have created the receipt
        existing = receipts_col.find_one({"transaction_id": transaction_id})
        if existing:
            return existing
        logger.error("Failed to create receipt for %s: %s", transaction_id, e)
        raise
