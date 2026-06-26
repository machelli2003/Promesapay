from datetime import datetime
from bson import ObjectId

def create_withdrawal_doc(
    user_id,
    payment_method_id,
    amount,
    reason=None,
    status="pending",  # pending | approved | rejected | completed | failed
):
    """
    Create a withdrawal request document.
    
    Status flow:
    - pending: User has requested withdrawal, awaiting admin review
    - approved: Admin has approved, ready to send
    - rejected: Admin rejected the request
    - completed: Funds have been sent to payment method
    - failed: Payment processing failed
    """
    return {
        "_id": ObjectId(),
        "user_id": user_id,
        "payment_method_id": payment_method_id,
        "amount": amount,
        "status": status,
        "reason": reason or "",
        "admin_notes": "",
        "rejection_reason": None,  # If rejected, reason why
        "approved_by": None,  # Admin user ID who approved
        "approved_at": None,
        "rejected_by": None,  # Admin user ID who rejected
        "rejected_at": None,
        "completed_at": None,
        "transaction_id": None,  # Payment provider transaction ID
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
