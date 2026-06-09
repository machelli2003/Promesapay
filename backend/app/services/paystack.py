import requests
import os
from ..config import settings

PAYSTACK_BASE = "https://api.paystack.co"

headers = {
    "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
    "Content-Type": "application/json",
}


def initialize_payment(email, amount_ghc, reference, metadata=None, split_payload=None):
    """
    Initialize a Paystack transaction. Amount in GHC, converted to pesewas.

    When Paystack splits are enabled (see app/services/paystack_splits.py), pass
    split_payload from build_paystack_split_payload() to allocate platform/creator
  shares at the gateway.
    """
    payload = {
        "email": email,
        "amount": int(amount_ghc * 100),  # Paystack uses lowest currency unit
        "currency": "GHS",
        "reference": reference,
        "metadata": metadata or {},
        "callback_url": settings.frontend_url("payment/verify"),
    }
    if split_payload:
        payload.update(split_payload)
    try:
        res = requests.post(f"{PAYSTACK_BASE}/transaction/initialize", json=payload, headers=headers)
        return res.json()
    except requests.exceptions.RequestException as e:
        return {"status": False, "message": f"Failed to connect to Paystack: {str(e)}"}


def verify_payment(reference):
    """Verify a Paystack transaction by reference."""
    try:
        res = requests.get(f"{PAYSTACK_BASE}/transaction/verify/{reference}", headers=headers)
        return res.json()
    except requests.exceptions.RequestException as e:
        return {"status": False, "message": f"Failed to connect to Paystack: {str(e)}"}


BANK_NAME_TO_CODE = {
    "access bank": "044",
    "access": "044",
    "absa": "023",
    "barclays": "023",
    "gcb": "053",
    "ghana commercial bank": "053",
    "ecobank": "232",
    "gtbank": "058",
    "guaranty trust bank": "058",
    "stanbic": "068",
    "stanbic bank": "068",
    "zenith": "057",
    "zenith bank": "057",
    "fidelity": "070",
    "fidelity bank": "070",
    "cal": "068",
    "cal bank": "068",
}


def _normalize_bank_code(bank_code_or_name):
    if not bank_code_or_name:
        return None
    text = str(bank_code_or_name).strip()
    if text.isdigit():
        return text
    normalized = text.lower().strip()
    return BANK_NAME_TO_CODE.get(normalized)


def create_transfer_recipient(account_info, method_type, provider, recipient_name=None):
    """Create a Paystack transfer recipient for a payout."""
    if provider != "paystack":
        return {"status": False, "message": "Unsupported provider for Paystack recipient creation."}

    if method_type == "bank_transfer":
        bank_code = _normalize_bank_code(account_info.get("bank_code") or account_info.get("bank_name"))
        if not bank_code:
            return {"status": False, "message": "Bank code is required for Paystack bank transfer recipients."}

        payload = {
            "type": "nuban",
            "name": recipient_name or account_info.get("account_name"),
            "account_number": account_info.get("account_number"),
            "bank_code": bank_code,
            "currency": "GHS",
        }
    elif method_type == "mobile_money":
        payload = {
            "type": "mobile_money",
            "name": recipient_name or account_info.get("account_name") or account_info.get("phone"),
            "phone": account_info.get("phone"),
            "currency": "GHS",
            "provider": account_info.get("provider") or account_info.get("mobile_provider"),
        }
    else:
        return {"status": False, "message": f"Unsupported payout method type for Paystack recipient creation: {method_type}."}

    try:
        res = requests.post(f"{PAYSTACK_BASE}/transferrecipient", json=payload, headers=headers)
        return res.json()
    except requests.exceptions.RequestException as e:
        return {"status": False, "message": f"Failed to connect to Paystack: {str(e)}"}


def initiate_transfer(amount_ghc, recipient_code, reason=None):
    """Create a Paystack transfer from the platform balance."""
    payload = {
        "source": "balance",
        "amount": int(amount_ghc * 100),
        "recipient": recipient_code,
    }
    if reason:
        payload["reason"] = reason

    try:
        res = requests.post(f"{PAYSTACK_BASE}/transfer", json=payload, headers=headers)
        return res.json()
    except requests.exceptions.RequestException as e:
        return {"status": False, "message": f"Failed to connect to Paystack: {str(e)}"}


def verify_transfer(reference):
    """Verify a Paystack transfer by reference."""
    try:
        res = requests.get(f"{PAYSTACK_BASE}/transfer/{reference}", headers=headers)
        return res.json()
    except requests.exceptions.RequestException as e:
        return {"status": False, "message": f"Failed to connect to Paystack: {str(e)}"}