from datetime import datetime
from bson import ObjectId

def create_donation_doc(recipient_id, amount, donor_name, donor_email, message="", reference="", status="pending"):
    return {
        "_id": ObjectId(),
        "recipient_id": recipient_id,
        "amount": amount,
        "donor_name": donor_name,
        "donor_email": donor_email,
        "message": message,
        "reference": reference,
        "status": status,  # pending | success | failed
        "type": "donation",
        "created_at": datetime.utcnow()
    }