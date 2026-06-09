import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

const CATEGORY_EMOJI = {
  Medical: "🏥",
  Emergency: "🚨",
  Education: "📚",
  Community: "🤝",
  Creative: "🎨",
  Business: "💼",
  Other: "✨",
};

export default function CampaignCard({ campaign }) {
  const pct = campaign.percent_funded ?? 0;
  const emoji = CATEGORY_EMOJI[campaign.category] || "✨";

  return (
    <Link
      to={`/c/${campaign.slug}`}
      className="card interactive overflow-hidden flex flex-col h-full hover:border-sky-300 dark:hover:border-sky-700"
    >
      <div className="h-32 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 flex items-center justify-center text-4xl">
        {campaign.cover_image ? (
          <img
            src={campaign.cover_image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{emoji}</span>
        )}
      </div>
      <div className="card-body flex flex-col flex-1 gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-sky-600 dark:text-sky-400">
            {campaign.category}
          </span>
          {pct >= 100 && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Funded!
            </span>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-50 line-clamp-2">
          {campaign.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          by {campaign.owner?.full_name || campaign.owner?.username}
        </p>
        <div className="mt-auto space-y-2">
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(campaign.amount_raised || 0)} raised
            </span>
            {campaign.goal_amount > 0 && (
              <span>of {formatCurrency(campaign.goal_amount)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
