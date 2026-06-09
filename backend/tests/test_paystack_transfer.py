import pytest
from unittest.mock import patch, MagicMock

from app.services.paystack import create_transfer_recipient, initiate_transfer


class TestPaystackTransferService:
    @patch("app.services.paystack.requests.post")
    def test_create_transfer_recipient_bank_transfer(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": True,
            "data": {"recipient_code": "RCP_abc123"},
        }
        mock_post.return_value = mock_response

        result = create_transfer_recipient(
            account_info={
                "bank_code": "058",
                "account_number": "1234567890",
                "account_name": "Test User",
            },
            method_type="bank_transfer",
            provider="paystack",
            recipient_name="Test User",
        )

        assert result["status"] is True
        assert result["data"]["recipient_code"] == "RCP_abc123"

    @patch("app.services.paystack.requests.post")
    def test_create_transfer_recipient_fails_without_bank_code(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = {"status": False, "message": "Invalid payload"}
        mock_post.return_value = mock_response

        result = create_transfer_recipient(
            account_info={
                "bank_name": "GTBank",
                "account_number": "1234567890",
                "account_name": "Test User",
            },
            method_type="bank_transfer",
            provider="paystack",
            recipient_name="Test User",
        )

        assert result["status"] is False
        assert "Bank code" in result["message"]

    @patch("app.services.paystack.requests.post")
    def test_initiate_transfer(self, mock_post):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "status": True,
            "data": {"reference": "TRF_123", "status": "pending"},
        }
        mock_post.return_value = mock_response

        result = initiate_transfer(150.0, "RCP_abc123", reason="Creator payout")

        assert result["status"] is True
        assert result["data"]["reference"] == "TRF_123"
