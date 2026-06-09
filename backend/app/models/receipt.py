from datetime import datetime
from bson import ObjectId

def create_receipt_doc(
    transaction_id,
    transaction_type,  # "donation" or "coffee"
    payer_name,
    payer_email,
    recipient_id,
    amount,
    currency="GHS",
    payment_reference="",
    receipt_number="",
):
    """
    Create a receipt document for transactions
    
    Used for generating PDF receipts and payment history
    """
    return {
        "_id": ObjectId(),
        "transaction_id": transaction_id,
        "transaction_type": transaction_type,  # donation or coffee
        "receipt_number": receipt_number,  # Formatted as REC-20260524-001
        "payer_name": payer_name,
        "payer_email": payer_email,
        "recipient_id": recipient_id,
        "amount": amount,
        "currency": currency,  # GHS, USD, EUR, etc.
        "payment_reference": payment_reference,  # Paystack reference
        "description": f"{transaction_type.title()} Payment",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "pdf_url": None,  # URL to generated PDF receipt
    }
