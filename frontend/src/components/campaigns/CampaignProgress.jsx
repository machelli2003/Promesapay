import { formatCurrency } from "../../utils/formatters";

export default function CampaignProgress({ campaign }) {
  const raised = campaign.amount_raised || 0;
  const goal = campaign.goal_amount || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <div className="card card-body space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {formatCurrency(raised)}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">raised</p>
        </div>
        {goal > 0 && (
          <div className="text-right">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              {pct}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              of {formatCurrency(goal)} goal
            </p>
          </div>
        )}
      </div>
      {goal > 0 && (
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {campaign.donor_count || 0} supporter{(campaign.donor_count || 0) !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
