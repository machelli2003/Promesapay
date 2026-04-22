import { Heart, Coffee, MessageSquare } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import Avatar from "../ui/Avatar";
import EmptyState from "../ui/EmptyState";

export default function SupportersList({ supporters = [] }) {
  if (!supporters.length) {
    return (
      <div className="card">
        <EmptyState
          icon={Heart}
          title="No supporters yet"
          description="Be the first to show your support!"
        />
      </div>
    );
  }

  return (
    <div className="card card-body space-y-1">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Recent supporters
      </h3>

      <div className="space-y-0 divide-y divide-gray-50">
        {supporters.map((s) => (
          <div key={s.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <Avatar name={s.donor_name} size="sm" className="mt-0.5 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {s.donor_name}
                </p>
                <p className="text-xs text-gray-400 shrink-0">
                  {formatDate(s.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-1.5 mt-0.5">
                {s.type === "coffee" ? (
                  <Coffee className="h-3 w-3 text-amber-500 shrink-0" strokeWidth={2} />
                ) : (
                  <Heart className="h-3 w-3 text-rose-400 shrink-0" strokeWidth={2} />
                )}
                <p className="text-xs text-gray-500">
                  {s.type === "coffee"
                    ? `Sent ${s.cups} coffee${s.cups > 1 ? "s" : ""} · ${formatCurrency(s.amount)}`
                    : `Donated ${formatCurrency(s.amount)}`
                  }
                </p>
              </div>

              {s.message && (
                <div className="flex items-start gap-1.5 mt-1.5 bg-gray-50 rounded-lg px-3 py-2">
                  <MessageSquare className="h-3 w-3 text-gray-300 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-500 italic leading-relaxed">
                    "{s.message}"
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}