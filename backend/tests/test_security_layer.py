"""Tests for security layer helpers."""

import importlib.util
import os
import sys

# Load payment_fees-style isolated modules
def _load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_totp_roundtrip():
    base = os.path.join(os.path.dirname(__file__), "..", "app", "security")
    crypto = _load_module("crypto", os.path.join(base, "crypto.py"))
    # Patch settings for crypto
    sys.modules["app"] = type(sys)("app")
    sys.modules["app.config"] = type(sys)("config")

    class FakeSettings:
        SECRET_KEY = "a" * 32

    sys.modules["app.config"].settings = FakeSettings()
    import importlib
    importlib.reload(crypto)

    secret = "JBSWY3DPEHPK3PXP"
    enc = crypto.encrypt_value(secret)
    assert crypto.decrypt_value(enc) == secret

    import pyotp
    code = pyotp.TOTP(secret).now()
    assert pyotp.TOTP(secret).verify(code, valid_window=1)


def test_fee_split_unchanged():
    fees = _load_module(
        "payment_fees",
        os.path.join(os.path.dirname(__file__), "..", "app", "services", "payment_fees.py"),
    )
    result = fees.calculate_fee_split(100)
    assert result["platform_fee"] == 8.0
    assert result["creator_earnings"] == 90.0
