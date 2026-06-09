from datetime import datetime
from bson import ObjectId


def create_campaign_update_doc(campaign_id, author_id, title, body):
    return {
        "_id": ObjectId(),
        "campaign_id": campaign_id,
        "author_id": author_id,
        "title": title,
        "body": body,
        "created_at": datetime.utcnow(),
    }
