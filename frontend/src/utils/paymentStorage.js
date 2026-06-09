const PENDING_PAYMENT_KEY = "promesapay_pending_payment";

export function savePendingPayment(data) {
  sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(data));
}

export function loadPendingPayment() {
  const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  sessionStorage.removeItem(PENDING_PAYMENT_KEY);
}

/** Infer payment type from Paystack reference prefix. */
export function inferPaymentType(reference) {
  if (!reference) return null;
  if (reference.startsWith("cof_")) return "coffee";
  if (reference.startsWith("don_")) return "donation";
  return null;
}
