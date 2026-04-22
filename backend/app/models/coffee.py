from datetime import datetime
from bson import ObjectId

def create_coffee_doc(recipient_id, cups, amount, donor_name, donor_email, message="", reference="", status="pending"):
    return {
        "_id": ObjectId(),
        "recipient_id": recipient_id,
        "cups": cups,
        "amount": amount,
        "donor_name": donor_name,
        "donor_email": donor_email,
        "message": message,
        "reference": reference,
        "status": status,
        "type": "coffee",
        "created_at": datetime.utcnow()
    }