import { FiCheckCircle, FiHeart, FiHome, FiExternalLink } from "react-icons/fi";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";
import AppButton from "../ui/AppButton";

export default function PaymentSuccess({ type, amount, cups, recipientUsername, onClose }) {
  const isDoll = type === "doll";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-xl
                      animate-scale-in overflow-hidden">

        {/* Top accent */}
        <div className={`h-1.5 w-full ${isDoll ? "bg-amber-400" : "bg-sky-500"}`} />

        <div className="px-6 py-8 text-center space-y-4">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
            isDoll ? "bg-amber-50 dark:bg-amber-900/20" : "bg-sky-50 dark:bg-sky-900/20"
          }`}>
            {isDoll
              ? <span className="text-2xl">🧸</span>
              : <FiHeart className="h-7 w-7 text-sky-600 dark:text-sky-400" strokeWidth={1.75} />
            }
          </div>

          {/* Check */}
          <div className="flex items-center justify-center gap-1.5">
            <FiCheckCircle className="h-4 w-4 text-green-500" strokeWidth={2} />
            <span className="text-xs font-medium text-green-600">Payment confirmed</span>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {isDoll ? "Doll sent!" : "Thank you!"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isDoll
                ? `You sent ${cups} doll${cups > 1 ? "s" : ""} to @${recipientUsername}`
                : `Your donation of ${formatCurrency(amount)} was received`
              }
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              A receipt has been sent to your email
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link to="/" onClick={onClose}>
              <AppButton variant="secondary" size="sm" icon={FiHome} className="w-full">
                Home
              </AppButton>
            </Link>
            <Link to={`/u/${recipientUsername}`} onClick={onClose}>
              <AppButton size="sm" icon={FiExternalLink} className="w-full">
                View page
              </AppButton>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}