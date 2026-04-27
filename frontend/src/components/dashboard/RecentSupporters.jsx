import { Heart, Coffee } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "../../utils/formatters";

export default function RecentSupporters({ transactions = [] }) {
  if (!transactions.length) {
    return (
      <div className="card text-center py-12">
        <p className="text-4xl mb-3">💝</p>
        <p className="font-semibold text-slate-700 dark:text-slate-300">No supporters yet</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Share your profile to start receiving support</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <Heart className="h-4 w-4 text-red-400 fill-red-400" />
        Recent Supporters
      </h3>
      <div className="space-y-3">
        {transactions.slice(0, 6).map((txn) => (
          <div key={txn.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {getInitials(txn.donor_name)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{txn.donor_name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {txn.type === "coffee"
                  ? <Coffee className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  : <Heart className="h-3 w-3 text-rose-400 shrink-0" />
                }
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {txn.type === "coffee"
                    ? `Bought ${txn.cups} coffee${txn.cups > 1 ? "s" : ""}`
                    : "Made a donation"
                  }
                </p>
              </div>
              {txn.message && (
                <p className="text-xs italic text-slate-400 dark:text-slate-500 truncate mt-0.5">"{txn.message}"</p>
              )}
            </div>

            {/* Amount + date */}
            <div className="text-right shrink-0">
              <p className="font-bold text-sm text-violet-600 dark:text-violet-400">{formatCurrency(txn.amount)}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(txn.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}