from app.services.payment_fees import calculate_fee_split


def test_fee_split_100_ghc():
    fees = calculate_fee_split(100)
    assert fees["gross_amount"] == 100.0
    assert fees["paystack_fee"] == 2.0
    assert fees["platform_fee"] == 8.0
    assert fees["creator_earnings"] == 90.0


def test_fee_split_rounding():
    fees = calculate_fee_split(10.55)
    assert fees["gross_amount"] == 10.55
    assert fees["paystack_fee"] == 0.21
    assert fees["platform_fee"] == 0.84
    assert fees["creator_earnings"] == 9.5
