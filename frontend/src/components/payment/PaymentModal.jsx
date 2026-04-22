import { useState } from "react";
import { X, CreditCard, Coffee, Heart, Lock, AlertCircle } from "lucide-react";
import { usePaystack } from "../../hooks/usePaystack";
import { useToast } from "../../hooks/useToast";
import { formatCurrency } from "../../utils/formatters";
import { COFFEE_PRICE } from "../../utils/constants";
import AppButton from "../ui/AppButton";

export default function PaymentModal({ type, payload, recipient, onClose, onSuccess }) {
  const { pay, loading } = usePaystack();
  const { success }      = useToast();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const isCoffee = type === "coffee";
  const amount   = isCoffee ? payload.cups * COFFEE_PRICE : payload.amount;

  const validate = () => {
    if (!email.trim()) { setEmailError("Email is required"); return false; }
    if (!email.includes("@")) { setEmailError("Enter a valid email"); return false; }
    setEmailError("");
    return true;
  };

  const handlePay = async () => {
    if (!validate()) return;
    await pay({
      type,
      payload: { ...payload, donor_email: email },
      recipient,
      onSuccess: (updatedUser) => {
        success(isCoffee
          ? `☕ ${payload.cups} coffee${payload.cups > 1 ? "s" : ""} sent!`
          : "💝 Donation successful!"
        );
        onSuccess(updatedUser);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl
                      shadow-xl animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isCoffee ? "bg-amber-50" : "bg-rose-50"
            }`}>
              {isCoffee
                ? <Coffee className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                : <Heart className="h-4 w-4 text-rose-500" strokeWidth={1.75} />
              }
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {isCoffee
                  ? `Send ${payload.cups} coffee${payload.cups > 1 ? "s" : ""}`
                  : "Make a donation"
                }
              </h2>
              <p className="text-xs text-gray-400">to @{recipient.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost btn-sm p-2 text-gray-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-gray-500">Supporter</span>
              <span className="text-sm font-medium text-gray-900">{payload.donor_name}</span>
            </div>
            {isCoffee && (
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-xs text-gray-500">Coffees</span>
                <span className="text-sm font-medium text-gray-900">☕ × {payload.cups}</span>
              </div>
            )}
            {payload.message && (
              <div className="flex justify-between items-start gap-4 px-4 py-3">
                <span className="text-xs text-gray-500 shrink-0">Message</span>
                <span className="text-xs text-gray-600 text-right italic">
                  "{payload.message}"
                </span>
              </div>
            )}
            <div className="flex justify-between items-center px-4 py-3 bg-white">
              <span className="text-sm font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(amount)}
              </span>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="field-label">
              Your email
              <span className="text-red-400 ml-0.5">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
              placeholder="you@example.com"
              className={`input ${emailError ? "input-error" : ""}`}
            />
            {emailError && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" /> {emailError}
              </p>
            )}
            <p className="field-hint">Used for your payment receipt only</p>
          </div>

          {/* Pay button */}
          <AppButton
            onClick={handlePay}
            loading={loading}
            size="lg"
            icon={CreditCard}
            className={`w-full ${
              isCoffee
                ? "bg-amber-500 hover:bg-amber-600 border-amber-500"
                : "bg-sky-500 hover:bg-sky-600"
            }`}
          >
            Pay {formatCurrency(amount)} via Paystack
          </AppButton>

          {/* Security note */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <Lock className="h-3 w-3" strokeWidth={2} />
            Secured by Paystack · 256-bit SSL
          </div>
        </div>
      </div>
    </div>
  );
}