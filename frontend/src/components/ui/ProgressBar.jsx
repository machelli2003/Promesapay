import clsx from "clsx";

export default function ProgressBar({
  value = 0,
  max = 100,
  size = "md",
  showLabel = false,
  className = "",
  ...props
}) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={clsx("flex items-center gap-3", className)} {...props}>
      <div className={clsx("progress-bar flex-1", sizes[size] || sizes.md)}>
        <div
          className="progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-heading text-sm font-bold text-gold-500 whitespace-nowrap">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}