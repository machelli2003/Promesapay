import clsx from "clsx";

export default function PageHeader({
  title,
  description,
  actions,
  className = "",
}) {
  return (
    <div className={clsx("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8", className)}>
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-navy-900 dark:text-navy-50">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}