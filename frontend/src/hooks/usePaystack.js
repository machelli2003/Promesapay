import { useState } from "react";
import { initiateDonation } from "../api/donations";
import { initiateCoffee } from "../api/coffee";
import { DOLL_PRICE } from "../utils/constants";
import { useToast } from "./useToast";
import { savePendingPayment } from "../utils/paymentStorage";

export function usePaystack() {
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const pay = async ({ type, payload, recipient, campaignSlug, onSuccess }) => {
    setLoading(true);

    try {
      const baseData = {
        amount: payload.amount,
        donor_name: payload.donor_name || "Anonymous",
        donor_email: payload.email,
      };

      if (campaignSlug) {
        baseData.campaign_slug = campaignSlug;
      } else if (recipient?.username) {
        baseData.recipient_username = recipient.username;
      }

      let initRes;
      if (type === "donation") {
        initRes = await initiateDonation({ ...baseData });
      } else {
        initRes = await initiateCoffee({ ...baseData, message: payload.note || "" });
      }

      const { authorization_url, reference } = initRes.data;

      if (!authorization_url || !reference) {
        throw new Error("Invalid payment session from server");
      }

      savePendingPayment({
        type,
        reference,
        amount: payload.amount,
        recipientUsername: recipient?.username || "",
        campaignSlug: campaignSlug || "",
        cups: type === "doll" && payload.amount ? Math.round(payload.amount / DOLL_PRICE) : undefined,
      });

      // Full redirect — Paystack returns to /payment/verify?reference=...
      window.location.href = authorization_url;
    } catch (err) {
      error(err.response?.data?.error || err.message || "Payment failed. Try again.");
      setLoading(false);
    }
  };

  return { pay, loading };
}
