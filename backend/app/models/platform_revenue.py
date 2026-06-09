from datetime import datetime
from bson import ObjectId


def create_platform_revenue_doc(
    transaction_id,
    transaction_type,
    reference,
    recipient_id,
    gross_amount,
    paystack_fee,
    platform_fee,
    creator_earnings,
):
    return {
        "_id": ObjectId(),
        "transaction_id": transaction_id,
        "transaction_type": transaction_type,
        "reference": reference,
        "recipient_id": recipient_id,
        "gross_amount": gross_amount,
        "paystack_fee": paystack_fee,
        "platform_fee": platform_fee,
        "creator_earnings": creator_earnings,
        "created_at": datetime.utcnow(),
    }
