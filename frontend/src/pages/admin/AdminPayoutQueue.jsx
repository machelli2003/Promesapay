import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getAdminPayoutStats,
  getAdminPayouts,
  getAdminPayoutDetail,
  updateAdminPayoutStatus,
} from "../../api/adminPayouts";
import { formatCurrency } from "../../utils/formatters";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS = {
  pending: { bg: "#fef3c7", text: "#b45309" },
  processing: { bg: "#dbeafe", text: "#1d4ed8" },
  completed: { bg: "#d1fae5", text: "#047857" },
  failed: { bg: "#fee2e2", text: "#b91c1c" },
  cancelled: { bg: "#f3f4f6", text: "#6b7280" },
};

function StatCard({ label, value, accent }) {
  return (
    <div className="theme-card">
      <p className="theme-muted m-0 text-sm">{label}</p>
      <p className="m-0 mt-2 text-2xl font-bold" style={accent ? { color: accent } : undefined}>
        <span className={accent ? "" : "theme-heading"}>{value}</span>
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        padding: "0.25rem 0.6rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

function formatAccountDetails(type, details) {
  if (!details || typeof details !== "object") return "—";
  if (type === "bank_transfer") {
    return [details.bank_name, details.account_number, details.account_name].filter(Boolean).join(" · ");
  }
  if (type === "mobile_money") {
    return [details.provider, details.phone].filter(Boolean).join(" · ");
  }
  if (type === "paypal") {
    return details.email || "—";
  }
  if (type === "crypto") {
    return details.wallet_address || "—";
  }
  return JSON.stringify(details);
}

function actionLabel(action) {
  if (action === "processing") return "Process";
  if (action === "completed") return "Complete";
  if (action === "failed") return "Fail + refund";
  if (action === "cancelled") return "Cancel + refund";
  return action;
}

function btnStyle(bg, color, bordered = false) {
  return {
    background: bg,
    color,
    border: bordered ? "1px solid #d1d5db" : "none",
    padding: "0.35rem 0.65rem",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 600,
    cursor: "pointer",
  };
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
      <dt style={{ color: "#6b7280" }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}

export default function AdminPayoutQueue() {
  const [stats, setStats] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    status: "",
    notes: "",
    reference: "",
    failure_reason: "",
  });

  const loadStats = useCallback(async () => {
    try {
      const res = await getAdminPayoutStats();
      setStats(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load payout stats");
    }
  }, []);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminPayouts({
        status: statusFilter === "all" ? undefined : statusFilter,
        page,
        per_page: 20,
      });
      setPayouts(res.data.payouts || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      toast.error(err.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const openDetail = async (payout) => {
    try {
      const res = await getAdminPayoutDetail(payout._id);
      setSelected(res.data.payout);
      setForm({ status: "", notes: "", reference: "", failure_reason: "" });
      setModalOpen(true);
    } catch (err) {
      toast.error(err.message || "Failed to load payout details");
    }
  };

  const handleQuickAction = async (payout, status) => {
    const labels = {
      processing: "Mark this payout as processing?",
      completed: "Mark this payout as completed (funds sent)?",
      failed: "Mark as failed and refund the creator's wallet?",
      cancelled: "Cancel this payout and refund the creator's wallet?",
    };
    if (!window.confirm(labels[status] || `Update status to ${status}?`)) return;

    try {
      setSubmitting(true);
      await updateAdminPayoutStatus(payout._id, { status });
      toast.success(`Payout marked as ${status}`);
      await Promise.all([loadPayouts(), loadStats()]);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!form.status) {
      toast.error("Select a new status");
      return;
    }
    try {
      setSubmitting(true);
      await updateAdminPayoutStatus(selected._id, form);
      toast.success(`Payout marked as ${form.status}`);
      setModalOpen(false);
      setSelected(null);
      await Promise.all([loadPayouts(), loadStats()]);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const nextActions = (status) => {
    if (status === "pending") return ["processing", "failed", "cancelled"];
    if (status === "processing") return ["completed", "failed"];
    return [];
  };

  return (
    <div className="theme-page mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Payout Queue</h1>
        <p style={{ margin: "0.5rem 0 0", color: "#6b7280" }}>
          Review creator withdrawal requests and update payout status. Paystack transfers are automatically initiated for Paystack-supported payout methods.
        </p>
      </div>

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <StatCard label="Pending" value={stats.pending_count} accent="#b45309" />
          <StatCard label="Processing" value={stats.processing_count} accent="#1d4ed8" />
          <StatCard label="Pending amount" value={formatCurrency(stats.pending_amount)} accent="#111827" />
          <StatCard label="In-flight amount" value={formatCurrency(stats.processing_amount)} accent="#111827" />
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <label style={{ fontSize: "0.875rem", color: "#374151" }}>
          Filter:
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              marginLeft: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="theme-card overflow-hidden p-0">
        {loading ? (
          <p className="theme-muted py-8 text-center">Loading payouts…</p>
        ) : payouts.length === 0 ? (
          <p className="theme-muted py-8 text-center">No payouts in this queue.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left dark:bg-slate-800/80">
                  <th style={{ padding: "0.75rem 1rem" }}>Creator</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Amount</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Method</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Requested</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout._id} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3">
                      <div className="theme-heading font-semibold">
                        {payout.user?.full_name || payout.user?.username || "Unknown"}
                      </div>
                      <div className="theme-muted text-xs">{payout.user?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold theme-heading">
                      {formatCurrency(payout.amount)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textTransform: "capitalize" }}>
                      {(payout.payment_method_type || "").replace(/_/g, " ")}
                    </td>
                    <td className="theme-muted px-4 py-3">
                      {payout.created_at ? new Date(payout.created_at).toLocaleString() : "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <StatusBadge status={payout.status} />
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        <button type="button" onClick={() => openDetail(payout)} style={btnStyle("#f3f4f6", "#374151")}>
                          Details
                        </button>
                        {nextActions(payout.status).map((action) => (
                          <button
                            key={action}
                            type="button"
                            disabled={submitting}
                            onClick={() => handleQuickAction(payout, action)}
                            style={btnStyle(
                              action === "completed"
                                ? "#d1fae5"
                                : action === "failed" || action === "cancelled"
                                  ? "#fee2e2"
                                  : "#dbeafe",
                              action === "completed"
                                ? "#047857"
                                : action === "failed" || action === "cancelled"
                                  ? "#b91c1c"
                                  : "#1d4ed8"
                            )}
                          >
                            {actionLabel(action)}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.75rem", marginTop: "1rem" }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={btnStyle("#fff", "#374151", true)}
          >
            Previous
          </button>
          <span style={{ alignSelf: "center", fontSize: "0.875rem", color: "#6b7280" }}>
            Page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
            style={btnStyle("#fff", "#374151", true)}
          >
            Next
          </button>
        </div>
      )}

      {modalOpen && selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="theme-card max-h-[90vh] w-full max-w-lg overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="theme-heading mb-4 text-xl font-semibold">Payout details</h2>
            <dl style={{ margin: "0 0 1rem", fontSize: "0.875rem" }}>
              <DetailRow
                label="Creator"
                value={`${selected.user?.full_name || selected.user?.username} (${selected.user?.email})`}
              />
              <DetailRow label="Amount" value={formatCurrency(selected.amount)} />
              <DetailRow label="Status" value={<StatusBadge status={selected.status} />} />
              <DetailRow
                label="Payment details"
                value={formatAccountDetails(selected.payment_method_type, selected.account_details)}
              />
              <DetailRow label="Creator notes" value={selected.notes || "—"} />
              <DetailRow label="Transfer status" value={selected.transfer_status || "—"} />
              <DetailRow label="Reference" value={selected.reference || "—"} />
              {selected.transfer_data?.currency && (
                <DetailRow
                  label="Transfer currency"
                  value={`${selected.transfer_data.currency}`}
                />
              )}
            </dl>

            {nextActions(selected.status).length > 0 && (
              <form onSubmit={handleModalSubmit}>
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem", fontWeight: 500 }}>
                    New status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    required
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  >
                    <option value="">Select status</option>
                    {nextActions(selected.status).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {(form.status === "completed" || form.status === "processing") && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}>
                      Transfer reference (optional)
                    </label>
                    <input
                      value={form.reference}
                      onChange={(e) => setForm({ ...form, reference: e.target.value })}
                      placeholder="Bank ref / Paystack transfer code"
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                  </div>
                )}

                {form.status === "failed" && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}>
                      Failure reason
                    </label>
                    <input
                      value={form.failure_reason}
                      onChange={(e) => setForm({ ...form, failure_reason: e.target.value })}
                      placeholder="Why the payout failed"
                      style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                    />
                  </div>
                )}

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.875rem" }}>
                    Admin notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setModalOpen(false)} style={btnStyle("#f3f4f6", "#374151")}>
                    Close
                  </button>
                  <button type="submit" disabled={submitting} style={btnStyle("#2563eb", "#fff")}>
                    {submitting ? "Saving…" : "Update status"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
