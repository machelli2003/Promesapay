import clsx from "clsx";

const variants = {
  gold: "badge-gold",
  navy: "badge-navy",
  green: "badge-green",
  red: "badge-red",
  amber: "badge-amber",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function Badge({
  children,
  variant = "navy",
  className = "",
  dot = false,
  ...props
}) {
  return (
    <span className={clsx("badge", variants[variant] || variants.navy, className)} {...props}>
      {dot && (
        <span className={clsx("w-1.5 h-1.5 rounded-full", {
          "bg-gold-500": variant === "gold",
          "bg-navy-500": variant === "navy",
          "bg-emerald-500": variant === "green",
          "bg-red-500": variant === "red",
          "bg-amber-500": variant === "amber",
        })} />
      )}
      {children}
    </span>
  );
}