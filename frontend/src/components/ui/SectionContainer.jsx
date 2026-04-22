import clsx from "clsx";

export default function SectionContainer({
  children,
  title,
  subtitle,
  action,
  className = "",
}) {
  return (
    <section className={clsx("section-wrapper", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4">
          <div className="section-header">
            {title && <h2 className="text-2xl font-bold">{title}</h2>}
            {subtitle && <p className="text-slate-600 dark:text-slate-400">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
