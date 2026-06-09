import { verifyDonation } from "./donations";
import { verifyCoffee } from "./coffee";
import { inferPaymentType } from "../utils/paymentStorage";

/**
 * Verify a Paystack payment by reference (donation or coffee).
 */
export async function verifyPaymentByReference(reference) {
  const type = inferPaymentType(reference);

  if (type === "donation") {
    return verifyDonation(reference);
  }
  if (type === "coffee") {
    return verifyCoffee(reference);
  }

  try {
    return await verifyDonation(reference);
  } catch {
    return verifyCoffee(reference);
  }
}
