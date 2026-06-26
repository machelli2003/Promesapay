from datetime import datetime
from bson import ObjectId

def create_transaction_doc(
    user_id,
    transaction_type,  # "donation_received", "withdrawal", "admin_allocation", "refund"
    amount,
    description,
    reference_id=None,  # Reference to donation, withdrawal, etc.
    payment_method_id=None,
    status="completed",  # pending | completed | failed | reversed
    metadata=None,
):
    """
    Create a transaction record for audit trail.
    
    Transaction types:
    - donation_received: Money received from donor
    - withdrawal: Money withdrawn to payment method
    - admin_allocation: Admin allocated funds directly
    - refund: Refund issued
    - dispute_reversal: Funds reversed due to dispute
    """
    return {
        "_id": ObjectId(),
        "user_id": user_id,
        "transaction_type": transaction_type,
        "amount": amount,
        "description": description,
        "reference_id": reference_id,  # ID of withdrawal, donation, etc.
        "payment_method_id": payment_method_id,
        "status": status,
        "metadata": metadata or {},  # Any additional data
        "created_at": datetime.utcnow(),
    }
