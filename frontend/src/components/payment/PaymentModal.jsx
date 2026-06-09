import { useState } from "react";
import { FiX, FiCreditCard, FiCoffee, FiHeart, FiLock, FiAlertCircle } from "react-icons/fi";
import { usePaystack } from "../../hooks/usePaystack";
import { useToast } from "../../hooks/useToast";
import { formatCurrency } from "../../utils/formatters";
import { COFFEE_PRICE } from "../../utils/constants";

export default function PaymentModal({ type, payload, recipient, campaignSlug, onClose, onSuccess }) {
  const { pay, loading } = usePaystack();
  const { success } = useToast();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const isCoffee = type === "coffee";
  const amount = payload.amount || 0;

  const validate = () => {
    if (!name.trim()) { setNameError("Name is required"); return false; }
    if (!email.trim()) { setEmailError("Email is required"); return false; }
    if (!email.includes("@")) { setEmailError("Enter a valid email"); return false; }
    setNameError("");
    setEmailError("");
    return true;
  };

  const handlePay = async () => {
    if (!validate()) return;
    await pay({
      type,
      payload: { ...payload, donor_name: name, email },
      recipient,
      campaignSlug,
      onSuccess: () => {
        success(isCoffee ? `☕ Coffee sent!` : "💝 Donation successful!");
        onSuccess();
      },
    });
  };

  // Styles
  const S = {
    backdrop: {
      position: "fixed",
      inset: 0,
      zIndex: 50,
      backgroundColor: "rgba(15, 23, 42, 0.5)",
      backdropFilter: "blur(4px)",
      cursor: "pointer"
    },
    modal: {
      position: "fixed",
      inset: 0,
      zIndex: 51,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      padding: "0",
      "@media (min-width: 640px)": {
        alignItems: "center",
        padding: "16px"
      }
    },
    container: {
      position: "relative",
      width: "100%",
      maxWidth: "448px",
      backgroundColor: "#ffffff",
      borderRadius: "24px 24px 0 0",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      border: "1px solid #e2e8f0",
      overflow: "hidden",
      "@media (min-width: 640px)": {
        borderRadius: "16px"
      }
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 20px",
      borderBottom: "1px solid #e2e8f0",
      backgroundColor: "#ffffff",
      gap: "12px"
    },
    headerContent: {
      display: "flex",
      alignItems: "center",
      gap: "12px"
    },
    iconBox: {
      width: "32px",
      height: "32px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isCoffee ? "rgba(180, 83, 9, 0.1)" : "rgba(190, 24, 93, 0.1)"
    },
    headerText: {
      display: "flex",
      flexDirection: "column"
    },
    headerTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: "#0f172a",
      fontFamily: "DM Sans, -apple-system, sans-serif",
      margin: 0
    },
    headerSubtitle: {
      fontSize: "12px",
      color: "#64748b",
      margin: 0,
      marginTop: "2px"
    },
    closeBtn: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "32px",
      height: "32px",
      background: "none",
      border: "none",
      borderRadius: "8px",
      color: "var(--color-text-tertiary)",
      cursor: "pointer",
      transition: "background-color 0.2s",
      ":hover": {
        backgroundColor: "var(--color-background-secondary)"
      }
    },
    body: {
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      backgroundColor: "#ffffff",
    },
    summary: {
      backgroundColor: "#f8fafc",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid #e2e8f0"
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 16px",
      borderBottom: "1px solid var(--color-border-tertiary)",
      ":last-child": {
        borderBottom: "none"
      }
    },
    summaryLabel: {
      fontSize: "12px",
      color: "var(--color-text-tertiary)",
      fontFamily: "DM Sans, -apple-system, sans-serif"
    },
    summaryValue: {
      fontSize: "14px",
      fontWeight: "500",
      color: "var(--color-text-primary)",
      fontFamily: "DM Sans, -apple-system, sans-serif"
    },
    totalRow: {
      backgroundColor: "#ffffff",
    },
    totalLabel: {
      fontSize: "14px",
      fontWeight: "600",
      color: "var(--color-text-primary)",
      fontFamily: "DM Sans, -apple-system, sans-serif"
    },
    totalValue: {
      fontSize: "18px",
      fontWeight: "700",
      color: "var(--color-text-primary)",
      fontFamily: "DM Sans, -apple-system, sans-serif"
    },
    fieldGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    },
    label: {
      fontSize: "13px",
      fontWeight: "500",
      color: "#0f172a",
      fontFamily: "DM Sans, -apple-system, sans-serif",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    },
    required: {
      color: "#dc2626"
    },
    input: {
      fontSize: "14px",
      fontFamily: "DM Sans, -apple-system, sans-serif",
      padding: "10px 12px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      backgroundColor: "#ffffff",
      color: "#0f172a",
      transition: "border-color 0.2s"
    },
    inputError: {
      borderColor: "#dc2626",
      backgroundColor: "rgba(220, 38, 38, 0.05)"
    },
    hint: {
      fontSize: "12px",
      color: "var(--color-text-tertiary)",
      fontFamily: "DM Sans, -apple-system, sans-serif"
    },
    errorMsg: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "12px",
      color: "#dc2626",
      fontFamily: "DM Sans, -apple-system, sans-serif",
      margin: "6px 0 0 0"
    },
    button: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      fontWeight: "600",
      fontFamily: "DM Sans, -apple-system, sans-serif",
      border: "1px solid",
      borderRadius: "8px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      transition: "all 0.2s",
      backgroundColor: isCoffee ? "#b45309" : "#be185d",
      borderColor: isCoffee ? "#b45309" : "#be185d",
      color: "#ffffff",
      ":hover": {
        backgroundColor: isCoffee ? "#92400e" : "#9d174d",
        borderColor: isCoffee ? "#92400e" : "#9d174d"
      },
      ":disabled": {
        opacity: 0.6,
        cursor: "not-allowed"
      }
    },
    security: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      fontSize: "12px",
      color: "var(--color-text-tertiary)",
      fontFamily: "DM Sans, -apple-system, sans-serif"
    }
  };

  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.container}>
          {/* Header */}
          <div style={S.header}>
            <div style={S.headerContent}>
              <div style={S.iconBox}>
                {isCoffee ? (
                  <FiCoffee size={16} color={isCoffee ? "#b45309" : "#be185d"} />
                ) : (
                  <FiHeart size={16} color={isCoffee ? "#b45309" : "#be185d"} />
                )}
              </div>
              <div style={S.headerText}>
                <h2 style={S.headerTitle}>
                  {isCoffee ? "Send Coffee" : "Make Donation"}
                </h2>
                <p style={S.headerSubtitle}>to @{recipient.username}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={S.closeBtn}
              type="button"
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={S.body}>
            {/* Summary */}
            <div style={S.summary}>
              <div style={{...S.summaryRow}}>
                <span style={S.summaryLabel}>Amount</span>
                <span style={S.summaryValue}>{formatCurrency(amount)}</span>
              </div>
              {payload.note && (
                <div style={{...S.summaryRow}}>
                  <span style={S.summaryLabel}>Message</span>
                  <span style={{...S.summaryValue, fontStyle: "italic", textAlign: "right"}}>
                    "{payload.note}"
                  </span>
                </div>
              )}
              <div style={{...S.summaryRow, ...S.totalRow}}>
                <span style={S.totalLabel}>Total</span>
                <span style={S.totalValue}>{formatCurrency(amount)}</span>
              </div>
            </div>

            {/* Name */}
            <div style={S.fieldGroup}>
              <label style={S.label}>
                Your name
                <span style={S.required}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(""); }}
                placeholder="e.g., Jane Smith"
                style={{
                  ...S.input,
                  ...(nameError ? S.inputError : {})
                }}
              />
              {nameError && (
                <div style={S.errorMsg}>
                  <FiAlertCircle size={14} />
                  {nameError}
                </div>
              )}
            </div>

            {/* Email */}
            <div style={S.fieldGroup}>
              <label style={S.label}>
                Your email
                <span style={S.required}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                placeholder="you@example.com"
                style={{
                  ...S.input,
                  ...(emailError ? S.inputError : {})
                }}
              />
              {emailError && (
                <div style={S.errorMsg}>
                  <FiAlertCircle size={14} />
                  {emailError}
                </div>
              )}
              <p style={S.hint}>Used for your payment receipt only</p>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={loading}
              style={S.button}
              type="button"
            >
              <FiCreditCard size={16} />
              Pay {formatCurrency(amount)} via Paystack
            </button>

            {/* Security note */}
            <div style={S.security}>
              <FiLock size={14} />
              Secured by Paystack · 256-bit SSL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}