import clsx from "clsx";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div className={clsx("empty-state", className)}>
      {Icon && (
        <div className="empty-state-icon">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div>
        <h3 className="empty-state-title">{title}</h3>
        {description && (
          <p className="empty-state-description max-w-xs">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}