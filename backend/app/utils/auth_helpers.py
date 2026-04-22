import bcrypt
from bson import ObjectId

def hash_password(plain_password):
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def check_password(plain_password, hashed):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed.encode("utf-8"))

def serialize_doc(doc):
    """Convert MongoDB doc to JSON-serializable dict."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for key, val in doc.items():
        if isinstance(val, ObjectId):
            doc[key] = str(val)
    return doc