import { useState } from "react";
import { initiateDonation, verifyDonation } from "../api/donations";
import { initiateCoffee, verifyCoffee } from "../api/coffee";
import { useToast } from "./useToast";

export function usePaystack() {
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const pay = async ({ type, payload, recipient, onSuccess }) => {
    setLoading(true);

    try {
      const baseData = {
        recipient_username: recipient.username,
        donor_name: payload.donor_name,
        donor_email: payload.donor_email,
        message: payload.message || "",
      };

      // Step 1 — Initiate payment
      let initRes;
      if (type === "donation") {
        initRes = await initiateDonation({ ...baseData, amount: payload.amount });
      } else {
        initRes = await initiateCoffee({ ...baseData, cups: payload.cups });
      }

      const { authorization_url, reference } = initRes.data;

      // Step 2 — Open Paystack popup
      const popup = window.open(authorization_url, "_blank", "width=500,height=700");

      // Step 3 — Poll for popup close then verify
      const poll = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(poll);
          try {
            let verifyRes;
            if (type === "donation") {
              verifyRes = await verifyDonation(reference);
            } else {
              verifyRes = await verifyCoffee(reference);
            }

            if (verifyRes.data.status === "success") {
              onSuccess(verifyRes.data.user);
            } else {
              error("Payment was not completed.");
            }
          } catch {
            error("Could not verify payment. Please contact support.");
          } finally {
            setLoading(false);
          }
        }
      }, 1000);

    } catch (err) {
      error(err.response?.data?.error || "Payment failed. Try again.");
      setLoading(false);
    }
  };

  return { pay, loading };
}