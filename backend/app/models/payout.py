from datetime import datetime
from bson import ObjectId

def create_payout_doc(
    user_id,
    amount,
    payment_method_id,
    payment_method_type,
    payment_method_provider,
    account_details,
    status="pending",
    reference="",
    notes="",
):
    """
    Create a payout/withdrawal document
    
    Statuses: pending, processing, completed, failed, cancelled
    Payment method types: bank_transfer, mobile_money, paypal, crypto
    """
    return {
        "_id": ObjectId(),
        "user_id": user_id,
        "amount": amount,
        "payment_method_id": payment_method_id,
        "payment_method_type": payment_method_type,  # bank_transfer, mobile_money, paypal, crypto
        "payment_method_provider": payment_method_provider,  # paystack, flutterwave, momo, manual, etc.
        "account_details": account_details,  # Bank account, mobile number, PayPal email, wallet address, etc.
        "status": status,  # pending, processing, completed, failed, cancelled
        "reference": reference,  # Transaction reference from payment provider or payout transfer reference
        "notes": notes,  # Internal notes
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "processed_at": None,  # When payment was actually processed
    }
