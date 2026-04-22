import clsx from "clsx";

export function AppCard({ children, interactive = true, className = "", ...props }) {
  return (
    <div className={clsx("card", interactive && "interactive", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={clsx("card-header", className)}>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return (
    <div className={clsx("card-body", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={clsx("card-footer", className)}>
      {children}
    </div>
  );
}