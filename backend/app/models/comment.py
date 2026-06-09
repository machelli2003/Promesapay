from datetime import datetime
from bson import ObjectId


def create_comment_doc(campaign_id, author_name, body, author_id=None):
    doc = {
        "_id": ObjectId(),
        "campaign_id": campaign_id,
        "author_name": author_name,
        "body": body,
        "created_at": datetime.utcnow(),
    }
    if author_id:
        doc["author_id"] = author_id
    return doc
