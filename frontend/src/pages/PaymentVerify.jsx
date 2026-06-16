import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FiCheckCircle, FiXCircle, FiLoader, FiCoffee, FiHeart, FiHome, FiExternalLink } from "react-icons/fi";
import { verifyPaymentByReference } from "../api/payments";
import {
  loadPendingPayment,
  clearPendingPayment,
  inferPaymentType,
} from "../utils/paymentStorage";
import { formatCurrency } from "../utils/formatters";
import AppButton from "../components/ui/AppButton";
import { COFFEE_PRICE } from "../utils/constants";

export default function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const verifiedRef = useRef(false);
  const [state, setState] = useState("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState(null);
  const [pending] = useState(() => loadPendingPayment());

  const reference =
    searchParams.get("reference") ||
    searchParams.get("trxref") ||
    pending?.reference ||
    "";

  const paymentType =
    inferPaymentType(reference) || pending?.type || "donation";
  const isCoffee = paymentType === "coffee";

  const amount =
    pending?.amount ??
    result?.settlement?.gross_amount ??
    null;

  const recipientUsername =
    pending?.recipientUsername ||
    result?.user?.username ||
    "";

  const campaignSlug = pending?.campaignSlug || result?.campaign?.slug;

  useEffect(() => {
    if (verifiedRef.current) return;
    if (!reference) {
      setState("missing");
      setErrorMessage("No payment reference was found. Please try again from the campaign page.");
      return;
    }

    verifiedRef.current = true;

    (async () => {
      try {
        const res = await verifyPaymentByReference(reference);
        const data = res.data;

        if (data.status === "success") {
          setResult(data);
          setState("success");
          clearPendingPayment();
        } else {
          setState("failed");
          setErrorMessage(data.message || "Payment was not completed.");
          clearPendingPayment();
        }
      } catch (err) {
        setState("failed");
        setErrorMessage(
          err.message ||
            err.response?.data?.message ||
            "We could not verify your payment. If you were charged, contact support with your reference."
        );
      }
    })();
  }, [reference]);

  const cups =
    pending?.cups ||
    (amount && isCoffee ? Math.max(1, Math.round(amount / COFFEE_PRICE)) : 1);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div
          className={`h-1.5 w-full ${isCoffee ? "bg-amber-400" : "bg-sky-500"}`}
        />

        <div className="px-6 py-10 text-center space-y-5">
          {state === "verifying" && (
            <>
              <FiLoader className="h-12 w-12 mx-auto text-sky-500 animate-spin" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Confirming your payment…
              </h1>
              <p className="text-sm text-slate-500">
                Please wait while we verify with Paystack.
              </p>
              {reference && (
                <p className="text-xs text-slate-400 font-mono break-all">{reference}</p>
              )}
            </>
          )}

          {state === "success" && (
            <>
              <div
                className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                  isCoffee ? "bg-amber-50" : "bg-sky-50"
                }`}
              >
                {isCoffee ? (
                  <FiCoffee className="h-7 w-7 text-amber-600" />
                ) : (
                  <FiHeart className="h-7 w-7 text-sky-600" />
                )}
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <FiCheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-600">Payment confirmed</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {isCoffee ? (
                  <>
                    Coffee sent! <FiCoffee className="inline-block ml-1" size={24} />
                  </>
                ) : (
                  <>
                    Thank you! <FiHeart className="inline-block ml-1" size={24} />
                  </>
                )}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isCoffee && recipientUsername
                  ? `You sent ${cups} coffee${cups > 1 ? "s" : ""} to @${recipientUsername}`
                  : amount != null
                    ? `Your ${isCoffee ? "payment" : "donation"} of ${formatCurrency(amount, "GHS")} was received`
                    : "Your payment was successful"}
              </p>
              <p className="text-xs text-slate-400">
                A receipt will be sent to your email when available.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <Link to="/">
                  <AppButton variant="secondary" size="sm" icon={FiHome} className="w-full">
                    Home
                  </AppButton>
                </Link>
                {campaignSlug ? (
                  <Link to={`/c/${campaignSlug}`}>
                    <AppButton size="sm" icon={FiExternalLink} className="w-full">
                      View campaign
                    </AppButton>
                  </Link>
                ) : recipientUsername ? (
                  <Link to={`/u/${recipientUsername}`}>
                    <AppButton size="sm" icon={FiExternalLink} className="w-full">
                      View creator
                    </AppButton>
                  </Link>
                ) : (
                  <Link to="/campaigns">
                    <AppButton size="sm" icon={FiExternalLink} className="w-full">
                      Browse campaigns
                    </AppButton>
                  </Link>
                )}
              </div>
            </>
          )}

          {(state === "failed" || state === "missing") && (
            <>
              <FiXCircle className="h-12 w-12 mx-auto text-red-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {state === "missing" ? "Missing payment reference" : "Payment not verified"}
              </h1>
              <p className="text-sm text-slate-500">{errorMessage}</p>
              {reference && (
                <p className="text-xs text-slate-400 font-mono break-all">
                  Reference: {reference}
                </p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                {campaignSlug && (
                  <Link to={`/c/${campaignSlug}`}>
                    <AppButton className="w-full">Try again</AppButton>
                  </Link>
                )}
                {!campaignSlug && recipientUsername && (
                  <Link to={`/u/${recipientUsername}`}>
                    <AppButton className="w-full">Try again</AppButton>
                  </Link>
                )}
                <Link to="/">
                  <AppButton variant="secondary" className="w-full">
                    Go home
                  </AppButton>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
