from datetime import datetime
from bson import ObjectId

def create_coffee_doc(recipient_id, amount, donor_name, donor_email, message="", reference="", status="pending", campaign_slug=None):
    doc = {
        "_id": ObjectId(),
        "recipient_id": recipient_id,
        "amount": amount,
        "donor_name": donor_name,
        "donor_email": donor_email,
        "message": message,
        "reference": reference,
        "status": status,
        "type": "coffee",
        "created_at": datetime.utcnow()
    }
    if campaign_slug:
        doc["campaign_slug"] = campaign_slug
    return doc