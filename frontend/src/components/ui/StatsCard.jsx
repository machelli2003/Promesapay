import clsx from "clsx";

export default function StatsCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = "navy",
  className = "",
  ...props
}) {
  const colorClasses = {
    navy: "bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-navy-300",
    gold: "bg-gold-100 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400",
    green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className={clsx("stat-card", className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className={clsx("stat-card-icon", colorClasses[color] || colorClasses.navy)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {trend !== undefined && (
        <div className="flex items-center gap-2 mt-1">
          <span
            className={clsx(
              "text-sm font-semibold",
              trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {trend >= 0 ? "+" : ""}{trend}%
          </span>
          {trendLabel && <span className="stat-card-sub">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}