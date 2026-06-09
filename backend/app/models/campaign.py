from datetime import datetime
from bson import ObjectId

CAMPAIGN_CATEGORIES = [
    "Medical",
    "Emergency",
    "Education",
    "Community",
    "Creative",
    "Business",
    "Other",
]


def create_campaign_doc(
    owner_id,
    slug,
    title,
    story="",
    category="Other",
    goal_amount=0,
    cover_image="",
    payment_type="donation",
    status="active",
):
    return {
        "_id": ObjectId(),
        "owner_id": owner_id,
        "slug": slug,
        "title": title,
        "story": story,
        "category": category,
        "goal_amount": float(goal_amount),
        "cover_image": cover_image,
        "payment_type": payment_type,
        "status": status,
        "amount_raised": 0.0,
        "donor_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
