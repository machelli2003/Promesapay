from datetime import datetime
from bson import ObjectId

def create_payment_method_doc(
    user_id,
    method_type,
    provider,
    account_info,
    is_default=False,
):
    """
    Create a payment method document for receiving/withdrawing payments
    
    method_type: "bank_transfer", "mobile_money", "paypal", "crypto"
    provider: "paystack", "flutterwave", "momo", "manual", etc.
    account_info: Dictionary containing relevant account details
    approval_status: "pending" | "approved" | "rejected"
    """
    return {
        "_id": ObjectId(),
        "user_id": user_id,
        "method_type": method_type,  # bank_transfer, mobile_money, paypal, crypto
        "provider": provider,  # paystack, flutterwave, momo, manual, etc.
        "account_info": account_info,  # {bank_name, account_number, account_name} or {phone, provider} or {email} or {wallet_address}
        "is_default": is_default,
        "is_verified": False,  # Whether this payment method has been verified
        "verification_code": None,  # For manual verification
        "approval_status": "pending",  # pending | approved | rejected
        "approved_by": None,  # Admin user ID
        "approved_at": None,
        "rejection_reason": None,
        "rejected_by": None,  # Admin user ID
        "rejected_at": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
