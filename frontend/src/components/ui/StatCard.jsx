import clsx from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

const iconColorMap = {
  violet: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    icon: "text-violet-600 dark:text-violet-400",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    icon: "text-purple-600 dark:text-purple-400",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900",
    icon: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    bg: "bg-rose-100 dark:bg-rose-900",
    icon: "text-rose-600 dark:text-rose-400",
  },
};

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = "violet",
  className = "",
}) {
  const iconTheme = iconColorMap[iconColor] || iconColorMap.violet;

  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className={clsx("stat-card", className)}>
      <div className="flex items-start justify-between">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className={clsx("stat-card-icon", iconTheme.bg)}>
            <Icon className={clsx("h-5 w-5", iconTheme.icon)} />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="stat-card-value">{value}</p>
        {sub && <p className="stat-card-sub">{sub}</p>}
      </div>

      {trendLabel && (
        <div className={clsx("flex items-center gap-1.5 text-xs font-semibold", trendColor)}>
          <TrendIcon className="h-4 w-4" />
          {trendLabel}
        </div>
      )}
    </div>
  );
}