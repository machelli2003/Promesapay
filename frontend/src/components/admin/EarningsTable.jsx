import { formatCurrency, formatDate } from "../../utils/formatters";

export default function EarningsTable({ rows = [], loading }) {
  if (loading) {
    return <p className="theme-muted">Loading transactions…</p>;
  }

  if (!rows.length) {
    return <p className="theme-muted">No transactions in this date range.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left dark:bg-slate-800/80">
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">Date</th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">Reference</th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">Type</th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">Creator</th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">Gross</th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">Paystack (2%)</th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">Platform (8%)</th>
            <th className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">Creator net</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id || row.reference}
              className="border-t border-slate-200 dark:border-slate-700"
            >
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {row.created_at ? formatDate(row.created_at) : "—"}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                <code className="text-xs">{row.reference}</code>
              </td>
              <td className="px-3 py-2 capitalize text-slate-700 dark:text-slate-300">
                {row.transaction_type}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {row.creator_username || row.recipient_id || "—"}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {formatCurrency(row.gross_amount, "GHS")}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {formatCurrency(row.paystack_fee, "GHS")}
              </td>
              <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(row.platform_fee, "GHS")}
              </td>
              <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                {formatCurrency(row.creator_earnings, "GHS")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
