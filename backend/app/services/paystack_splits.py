"""
Paystack Transaction Split / subaccount integration (future).

When enabled, initialize_payment will pass split rules to Paystack so platform and
creator shares are allocated at the gateway instead of manual settlement in the backend.
"""

from ..db import platform_settings_col

SETTINGS_ID = "paystack_splits"

DEFAULT_SPLIT_CONFIG = {
    "_id": SETTINGS_ID,
    "enabled": False,
    "mode": "manual",
    "platform_subaccount_code": None,
    "platform_share_percent": 8.0,
    "paystack_fee_percent": 2.0,
    "creator_share_percent": 90.0,
    "paystack_fee_bearer": "account",
    "currency": "GHS",
    "notes": (
        "Set enabled=True after creating Paystack subaccounts for the platform and creators. "
        "See https://paystack.com/docs/payments/split-payments/"
    ),
}


def get_split_config():
    doc = platform_settings_col.find_one({"_id": SETTINGS_ID})
    if not doc:
        platform_settings_col.insert_one({**DEFAULT_SPLIT_CONFIG})
        doc = platform_settings_col.find_one({"_id": SETTINGS_ID})
    return _serialize_config(doc)


def update_split_config(updates: dict):
    allowed = {
        "enabled",
        "mode",
        "platform_subaccount_code",
        "platform_share_percent",
        "paystack_fee_bearer",
        "notes",
    }
    payload = {k: updates[k] for k in allowed if k in updates}
    if "mode" in payload and payload["mode"] not in ("manual", "paystack_split"):
        payload["mode"] = "manual"

    platform_settings_col.update_one(
        {"_id": SETTINGS_ID},
        {"$set": payload},
        upsert=True,
    )
    return get_split_config()


def build_paystack_split_payload(gross_amount_ghc: float, creator_subaccount_code: str | None):
    """
    Build Paystack split parameter for transaction/initialize (not active until enabled).

    Returns None when splits are disabled or creator subaccount is missing.
    """
    config = get_split_config()
    if not config.get("enabled") or config.get("mode") != "paystack_split":
        return None
    if not config.get("platform_subaccount_code") or not creator_subaccount_code:
        return None

    platform_share = round(gross_amount_ghc * (config["platform_share_percent"] / 100), 2)
    creator_share = round(gross_amount_ghc - platform_share, 2)

    return {
        "split": {
            "type": "flat",
            "bearer_type": config.get("paystack_fee_bearer", "account"),
            "subaccounts": [
                {
                    "subaccount": config["platform_subaccount_code"],
                    "share": int(platform_share * 100),
                },
                {
                    "subaccount": creator_subaccount_code,
                    "share": int(creator_share * 100),
                },
            ],
        }
    }


def _serialize_config(doc):
    return {
        "enabled": doc.get("enabled", False),
        "mode": doc.get("mode", "manual"),
        "platform_subaccount_code": doc.get("platform_subaccount_code"),
        "platform_share_percent": doc.get("platform_share_percent", 8.0),
        "paystack_fee_percent": doc.get("paystack_fee_percent", 2.0),
        "creator_share_percent": doc.get("creator_share_percent", 90.0),
        "paystack_fee_bearer": doc.get("paystack_fee_bearer", "account"),
        "currency": doc.get("currency", "GHS"),
        "notes": doc.get("notes", ""),
    }
