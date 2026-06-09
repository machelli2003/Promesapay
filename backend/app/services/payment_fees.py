"""Fee split constants and calculations for successful payments."""

PAYSTACK_FEE_RATE = 0.02
PLATFORM_FEE_RATE = 0.08


def calculate_fee_split(gross_amount):
    """
    Split gross payment into Paystack fee (2%), platform fee (8%), and creator net.

    Fees are calculated on gross; creator receives gross - paystack_fee - platform_fee.
    """
    gross = round(float(gross_amount), 2)
    paystack_fee = round(gross * PAYSTACK_FEE_RATE, 2)
    platform_fee = round(gross * PLATFORM_FEE_RATE, 2)
    creator_earnings = round(gross - paystack_fee - platform_fee, 2)
    return {
        "gross_amount": gross,
        "paystack_fee": paystack_fee,
        "platform_fee": platform_fee,
        "creator_earnings": creator_earnings,
    }
