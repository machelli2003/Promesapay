import logging
from pymongo import MongoClient
from pymongo.errors import OperationFailure
from .config import settings

client = MongoClient(
    settings.MONGO_URI,
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    socketTimeoutMS=30000,
)
db = client.get_database("fundme")

# Collections
users_col = db["users"]
donations_col = db["donations"]
coffee_col = db["coffee"]
# Backwards-compatible alias: internal code may refer to "doll", but
# the persistent collection name and external APIs remain "coffee".
doll_col = coffee_col
campaigns_col = db["campaigns"]
campaign_updates_col = db["campaign_updates"]
comments_col = db["comments"]
payouts_col = db["payouts"]
payment_methods_col = db["payment_methods"]
withdrawals_col = db["withdrawals"]
transactions_col = db["transactions"]
refunds_col = db["refunds"]
receipts_col = db["receipts"]
platform_revenue_col = db["platform_revenue"]
platform_settings_col = db["platform_settings"]
security_events_col = db["security_events"]
login_attempts_col = db["login_attempts"]
recovery_requests_col = db["recovery_requests"]
disputes_col = db["disputes"]
activity_log_col = db["activity_log"]
notifications_col = db["notifications"]
notification_prefs_col = db["notification_preferences"]

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
    
    # Campaign indexes
    campaigns_col.create_index("slug", unique=True)
    campaigns_col.create_index([("owner_id", 1), ("created_at", -1)])
    campaigns_col.create_index([("status", 1), ("created_at", -1)])
    campaigns_col.create_index([("category", 1), ("created_at", -1)])
    campaigns_col.create_index([("title", "text"), ("story", "text")])

    campaign_updates_col.create_index([("campaign_id", 1), ("created_at", -1)])
    comments_col.create_index([("campaign_id", 1), ("created_at", -1)])

    donations_col.create_index([("campaign_id", 1), ("status", 1), ("created_at", -1)])

    # TTL indexes for cleanup of old pending transactions (30 days)
    try:
        donations_col.create_index("created_at", expireAfterSeconds=2592000)
    except OperationFailure as e:
        if e.code == 85:  # IndexOptionsConflict
            logging.info("TTL index on donations.created_at already exists, skipping creation")
        else:
            raise
    
    try:
        coffee_col.create_index("created_at", expireAfterSeconds=2592000)
    except OperationFailure as e:
        if e.code == 85:  # IndexOptionsConflict
            logging.info("TTL index on coffee.created_at already exists, skipping creation")
        else:
            raise
    
    # Payouts indexes
    payouts_col.create_index([("user_id", 1), ("status", 1), ("created_at", -1)])
    payouts_col.create_index([("status", 1), ("created_at", -1)])
    
    # Payment methods indexes
    payment_methods_col.create_index([("user_id", 1), ("is_default", 1)])
    payment_methods_col.create_index([("user_id", 1), ("method_type", 1)])
    payment_methods_col.create_index([("approval_status", 1), ("created_at", -1)])
    payment_methods_col.create_index([("user_id", 1), ("approval_status", 1)])
    
    # Withdrawals indexes
    withdrawals_col.create_index([("user_id", 1), ("status", 1), ("created_at", -1)])
    withdrawals_col.create_index([("status", 1), ("created_at", -1)])
    withdrawals_col.create_index([("user_id", 1), ("created_at", -1)])
    
    # Transactions indexes
    transactions_col.create_index([("user_id", 1), ("created_at", -1)])
    transactions_col.create_index([("transaction_type", 1), ("created_at", -1)])
    transactions_col.create_index([("reference_id", 1)])
    
    # Refunds indexes
    refunds_col.create_index([("user_id", 1), ("status", 1), ("created_at", -1)])
    refunds_col.create_index([("transaction_id", 1)])
    
    # Receipts indexes
    receipts_col.create_index([("transaction_id", 1)])
    receipts_col.create_index([("payer_email", 1), ("created_at", -1)])
    receipts_col.create_index([("recipient_id", 1), ("created_at", -1)])

    platform_revenue_col.create_index([("reference", 1)], unique=True)
    platform_revenue_col.create_index([("created_at", -1)])
    platform_revenue_col.create_index([("recipient_id", 1), ("created_at", -1)])

    platform_settings_col.create_index("_id")

    security_events_col.create_index([("user_id", 1), ("created_at", -1)])
    security_events_col.create_index([("event_type", 1), ("created_at", -1)])
    security_events_col.create_index([("ip", 1), ("created_at", -1)])

    login_attempts_col.create_index([("identifier", 1), ("created_at", -1)])
    login_attempts_col.create_index([("ip", 1), ("created_at", -1)])
    try:
        login_attempts_col.create_index("created_at", expireAfterSeconds=604800)
    except OperationFailure as e:
        if e.code != 85:
            raise

    recovery_requests_col.create_index([("email", 1), ("purpose", 1), ("created_at", -1)])
    try:
        recovery_requests_col.create_index("expires_at", expireAfterSeconds=0)
    except OperationFailure:
        pass
    
    # Disputes indexes
    disputes_col.create_index([("user_id", 1), ("status", 1), ("created_at", -1)])
    disputes_col.create_index([("transaction_id", 1)])
    disputes_col.create_index([("status", 1), ("created_at", -1)])
    disputes_col.create_index([("priority", 1), ("status", 1)])
    
    # Activity log indexes
    activity_log_col.create_index([("admin_id", 1), ("timestamp", -1)])
    activity_log_col.create_index([("action", 1), ("timestamp", -1)])
    
    # Notification indexes
    notifications_col.create_index([("user_id", 1), ("created_at", -1)])
    notifications_col.create_index([("user_id", 1), ("read", 1), ("created_at", -1)])
    notifications_col.create_index([("user_id", 1), ("type", 1), ("created_at", -1)])
    notifications_col.create_index([("created_at", 1)], expireAfterSeconds=7776000)  # 90 days TTL for deleted notifications
    
    # Notification preferences indexes
    notification_prefs_col.create_index([("user_id", 1)], unique=True)
except Exception as e:
    logging.warning("MongoDB index creation failed: %s", e)