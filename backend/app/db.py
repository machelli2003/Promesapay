from pymongo import MongoClient
from .config import Config
import logging

client = MongoClient(Config.MONGO_URI)
db = client.get_database("fundme")

# Collections
users_col = db["users"]
donations_col = db["donations"]
coffee_col = db["coffee"]

# Indexes
try:
	users_col.create_index("email", unique=True)
	users_col.create_index("username", unique=True)
	donations_col.create_index("recipient_id")
	coffee_col.create_index("recipient_id")
except Exception as e:
	logging.error("MongoDB index creation failed: %s", e)