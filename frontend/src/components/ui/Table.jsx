import clsx from "clsx";
import Spinner from "./Spinner";

export default function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data found",
  emptyIcon: EmptyIcon,
  className = "",
  onRowClick,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        {EmptyIcon && (
          <div className="empty-state-icon">
            <EmptyIcon className="w-6 h-6" />
          </div>
        )}
        <p className="empty-state-title">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={clsx("overflow-x-auto rounded-xl border border-slate-200 dark:border-navy-700", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-50 dark:bg-navy-900/50">
            {columns.map((col, i) => (
              <th
                key={col.key || i}
                className={clsx(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-navy-700">
          {data.map((row, rowIdx) => (
            <tr
              key={row._id || row.id || rowIdx}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                "bg-white dark:bg-navy-800 transition-colors",
                onRowClick && "cursor-pointer hover:bg-navy-50 dark:hover:bg-navy-700"
              )}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={clsx(
                    "px-4 py-3 text-sm text-navy-700 dark:text-navy-200",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center"
                  )}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}