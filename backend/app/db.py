import logging
from pymongo import MongoClient
from .config import settings

client = MongoClient(
    settings.MONGO_URI,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
)
db = client.get_database("fundme")

# Collections
users_col = db["users"]
donations_col = db["donations"]
coffee_col = db["coffee"]

# Indexes
try:
    # Users indexes
    users_col.create_index("email", unique=True)
    users_col.create_index("username", unique=True)
    
    # Compound indexes for donations (optimized for most common queries)
    donations_col.create_index([("recipient_id", 1), ("status", 1), ("created_at", -1)])
    donations_col.create_index([("donor_id", 1), ("status", 1), ("created_at", -1)])
    
    # Compound indexes for coffee
    coffee_col.create_index([("recipient_id", 1), ("status", 1), ("created_at", -1)])
    coffee_col.create_index([("donor_id", 1), ("status", 1), ("created_at", -1)])
    
    # TTL indexes for cleanup of old pending transactions (30 days)
    donations_col.create_index("created_at", expireAfterSeconds=2592000)
    coffee_col.create_index("created_at", expireAfterSeconds=2592000)
except Exception as e:
    logging.warning("MongoDB index creation failed: %s", e)