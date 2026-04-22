import requests
import os
from ..config import Config

PAYSTACK_BASE = "https://api.paystack.co"

headers = {
    "Authorization": f"Bearer {Config.PAYSTACK_SECRET_KEY}",
    "Content-Type": "application/json",
}


def initialize_payment(email, amount_ghc, reference, metadata=None):
    """Initialize a Paystack transaction. Amount in GHC, converted to pesewas."""
    payload = {
        "email": email,
        "amount": int(amount_ghc * 100),  # Paystack uses lowest currency unit
        "currency": "GHS",
        "reference": reference,
        "metadata": metadata or {},
        "callback_url": f"{Config.FRONTEND_URL}/payment/verify",
    }
    res = requests.post(f"{PAYSTACK_BASE}/transaction/initialize", json=payload, headers=headers)
    return res.json()


def verify_payment(reference):
    """Verify a Paystack transaction by reference."""
    res = requests.get(f"{PAYSTACK_BASE}/transaction/verify/{reference}", headers=headers)
    return res.json()