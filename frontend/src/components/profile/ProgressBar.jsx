import { Target } from "lucide-react";
import { formatCurrency, calcProgress } from "../../utils/formatters";

export default function ProgressBar({ raised = 0, goal = 0, title = "" }) {
  const pct = calcProgress(raised, goal);

  return (
    <div className="card card-body space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
            <Target className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Funding goal
            </p>
            {title && (
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mt-0.5">{title}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">{pct}%</span>
          <p className="text-xs text-slate-400 dark:text-slate-500">funded</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 dark:bg-violet-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {formatCurrency(raised)}
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">raised</span>
          </span>
          <span className="text-slate-400 dark:text-slate-500">
            Goal: <span className="font-medium text-slate-600 dark:text-slate-300">{formatCurrency(goal)}</span>
          </span>
        </div>
      </div>

      {/* Goal reached banner */}
      {pct >= 100 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-lg px-4 py-2.5
                        text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          🎉 Goal reached — thank you so much!
        </div>
      )}
    </div>
  );
}