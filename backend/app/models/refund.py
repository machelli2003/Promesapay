from datetime import datetime
from bson import ObjectId

def create_refund_doc(
    transaction_id,
    transaction_type,  # "donation" or "coffee"
    user_id,
    original_amount,
    refund_amount,
    reason,
    status="pending",
    notes="",
):
    """
    Create a refund document
    
    Statuses: pending, approved, processing, completed, rejected
    Transaction types: donation, coffee
    """
    return {
        "_id": ObjectId(),
        "transaction_id": transaction_id,  # Reference to original donation or coffee
        "transaction_type": transaction_type,  # donation or coffee
        "user_id": user_id,  # User requesting the refund
        "original_amount": original_amount,
        "refund_amount": refund_amount,  # May be less than original for partial refunds
        "reason": reason,  # User's reason for requesting refund
        "status": status,  # pending, approved, processing, completed, rejected
        "notes": notes,  # Admin notes
        "processed_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
