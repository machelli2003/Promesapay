import { Coffee, Heart, Download, ChevronLeft,
         ChevronRight, ArrowUpDown } from "lucide-react";
import { formatCurrency, formatDate } from "../../utils/formatters";
import Avatar from "../ui/Avatar";
import EmptyState from "../ui/EmptyState";
import AppButton from "../ui/AppButton";

export default function TransactionTable({
  transactions = [], page, total, limit, onPageChange
}) {
  const totalPages = Math.ceil(total / limit);

  const exportCSV = () => {
    const headers = ["Date", "Donor", "Type", "Amount", "Cups", "Message", "Reference"];
    const rows    = transactions.map((t) => [
      formatDate(t.created_at), t.donor_name, t.type,
      t.amount, t.cups || "", t.message || "", t.reference,
    ]);
    const csv  = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `transactions-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!transactions.length) {
    return (
      <div className="card">
        <EmptyState
          icon={ArrowUpDown}
          title="No transactions yet"
          description="Donations and coffee tips will appear here once you start receiving support."
        />
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Table header */}
      <div className="card-header">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Transactions</h3>
          <p className="text-xs text-gray-400 mt-0.5">{total} total</p>
        </div>
        <AppButton
          variant="ghost"
          size="sm"
          icon={Download}
          onClick={exportCSV}
        >
          Export CSV
        </AppButton>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Supporter", "Type", "Amount", "Message", "Date"].map((h) => (
                <th key={h}
                  className="text-left text-2xs font-semibold text-gray-400
                             uppercase tracking-widest px-5 py-3 first:pl-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {transactions.map((txn) => (
              <tr key={txn.id}
                className="hover:bg-gray-50/60 transition-colors">
                {/* Supporter */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={txn.donor_name} size="sm" />
                    <span className="text-sm font-medium text-gray-900">
                      {txn.donor_name}
                    </span>
                  </div>
                </td>
                {/* Type */}
                <td className="px-5 py-3.5">
                  <span className={txn.type === "coffee" ? "badge-amber" : "badge-sky"}>
                    {txn.type === "coffee"
                      ? <><Coffee className="h-3 w-3" /> Coffee</>
                      : <><Heart className="h-3 w-3" /> Donation</>
                    }
                  </span>
                </td>
                {/* Amount */}
                <td className="px-5 py-3.5">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(txn.amount)}
                  </span>
                </td>
                {/* Message */}
                <td className="px-5 py-3.5 max-w-[200px]">
                  {txn.message
                    ? <span className="text-xs text-gray-400 italic truncate block">"{txn.message}"</span>
                    : <span className="text-xs text-gray-300">—</span>
                  }
                </td>
                {/* Date */}
                <td className="px-5 py-3.5">
                  <span className="text-xs text-gray-400">{formatDate(txn.created_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {transactions.map((txn) => (
          <div key={txn.id} className="flex items-center gap-3 px-5 py-3.5">
            <Avatar name={txn.donor_name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{txn.donor_name}</p>
              <p className="text-xs text-gray-400">{formatDate(txn.created_at)}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(txn.amount)}</p>
              <span className={txn.type === "coffee" ? "badge-amber" : "badge-sky"}>
                {txn.type}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-footer flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <AppButton
              variant="secondary"
              size="xs"
              icon={ChevronLeft}
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            />
            <AppButton
              variant="secondary"
              size="xs"
              icon={ChevronRight}
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
}