import { Target } from "lucide-react";
import { formatCurrency, calcProgress } from "../../utils/formatters";

export default function ProgressBar({ raised = 0, goal = 0, title = "" }) {
  const pct = calcProgress(raised, goal);

  return (
    <div className="card card-body space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
            <Target className="h-3.5 w-3.5 text-sky-500" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Funding goal
            </p>
            {title && (
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{title}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold text-sky-600">{pct}%</span>
          <p className="text-xs text-gray-400">funded</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-gray-900">
            {formatCurrency(raised)}
            <span className="text-gray-400 font-normal ml-1">raised</span>
          </span>
          <span className="text-gray-400">
            Goal: <span className="font-medium text-gray-600">{formatCurrency(goal)}</span>
          </span>
        </div>
      </div>

      {/* Goal reached banner */}
      {pct >= 100 && (
        <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2.5
                        text-sm font-medium text-green-700 flex items-center gap-2">
          🎉 Goal reached — thank you so much!
        </div>
      )}
    </div>
  );
}