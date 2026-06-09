import { useCallback, useEffect, useState } from "react";
import {
  getAdminOverview,
  getAdminTransactions,
  getPaystackSplitConfig,
  updatePaystackSplitConfig,
  downloadCsvReport,
  downloadPdfReport,
} from "../../api/adminFinance";
import DateRangeFilter from "../../components/admin/DateRangeFilter";
import RevenueChart from "../../components/admin/RevenueChart";
import EarningsTable from "../../components/admin/EarningsTable";
import { formatCurrency } from "../../utils/formatters";
import toast from "react-hot-toast";

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function StatCard({ label, value, accent }) {
  return (
    <div className="theme-card">
      <p className="theme-muted m-0 text-sm">{label}</p>
      <p
        className="m-0 mt-2 text-2xl font-bold"
        style={{ color: accent || undefined }}
      >
        <span className={!accent ? "theme-heading" : ""}>{value}</span>
      </p>
    </div>
  );
}

export default function AdminFinanceDashboard() {
  const [range, setRange] = useState(defaultRange);
  const [applied, setApplied] = useState(defaultRange);
  const [activeTab, setActiveTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [splitConfig, setSplitConfig] = useState(null);
  const [exporting, setExporting] = useState(null);

  const params = { start_date: applied.startDate, end_date: applied.endDate };

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOverview(params);
      setOverview(res.data);
    } catch (err) {
      toast.error(err.message || "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, [applied.startDate, applied.endDate]);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await getAdminTransactions({ ...params, page, per_page: 20 });
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      toast.error(err.message || "Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [applied.startDate, applied.endDate, page]);

  const loadSplitConfig = useCallback(async () => {
    try {
      const res = await getPaystackSplitConfig();
      setSplitConfig(res.data.config);
    } catch {
      /* optional tab */
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === "earnings") loadTransactions();
  }, [activeTab, loadTransactions]);

  useEffect(() => {
    if (activeTab === "splits") loadSplitConfig();
  }, [activeTab, loadSplitConfig]);

  const handleApplyRange = () => {
    setApplied(range);
    setPage(1);
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      if (type === "csv") await downloadCsvReport(params);
      else await downloadPdfReport(params);
      toast.success(`${type.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error(err.message || `Failed to export ${type}`);
    } finally {
      setExporting(null);
    }
  };

  const handleSaveSplits = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await updatePaystackSplitConfig({
        enabled: form.enabled.checked,
        mode: form.mode.value,
        platform_subaccount_code: form.platform_subaccount_code.value || null,
        platform_share_percent: parseFloat(form.platform_share_percent.value),
        paystack_fee_bearer: form.paystack_fee_bearer.value,
        notes: form.notes.value,
      });
      setSplitConfig(res.data.config);
      toast.success("Split configuration saved");
    } catch (err) {
      toast.error(err.message || "Failed to save configuration");
    }
  };

  const summary = overview?.summary || {};
  const tabs = [
    { id: "overview", label: "Revenue analytics" },
    { id: "earnings", label: "Platform earnings" },
    { id: "reports", label: "Export reports" },
    { id: "splits", label: "Paystack splits" },
  ];

  return (
    <div className="theme-page px-4 py-8 sm:px-8">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
            Admin Financial Dashboard
          </h1>
          <p className="theme-muted m-0 text-sm">
            Platform revenue, fee breakdowns, and financial exports
          </p>
        </header>

        <div className="theme-card mb-6">
          <DateRangeFilter
            startDate={range.startDate}
            endDate={range.endDate}
            onChange={setRange}
            onApply={handleApplyRange}
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.6rem 1.2rem",
                borderRadius: "6px",
                border: activeTab === tab.id ? "none" : "1px solid #d1d5db",
                background: activeTab === tab.id ? "#1e40af" : "#fff",
                color: activeTab === tab.id ? "#fff" : "#374151",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            {loading ? (
              <p>Loading analytics…</p>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <StatCard
                    label="Platform revenue (your 8%)"
                    value={formatCurrency(summary.total_platform_revenue || 0, "GHS")}
                    accent="#059669"
                  />
                  <StatCard
                    label="Gross volume"
                    value={formatCurrency(summary.total_gross_volume || 0, "GHS")}
                  />
                  <StatCard
                    label="Paystack fees (2%)"
                    value={formatCurrency(summary.total_paystack_fees || 0, "GHS")}
                  />
                  <StatCard
                    label="Creator net paid out"
                    value={formatCurrency(summary.total_creator_earnings || 0, "GHS")}
                  />
                  <StatCard label="Transactions" value={summary.transaction_count ?? 0} />
                  <StatCard
                    label="Completed payouts"
                    value={formatCurrency(summary.total_payouts_completed || 0, "GHS")}
                  />
                  <StatCard label="Pending payouts" value={summary.pending_payout_count ?? 0} />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div className="theme-card">
                    <h2 style={cardTitle}>Daily platform revenue</h2>
                    <RevenueChart
                      series={overview?.daily_breakdown || []}
                      valueKey="platform_revenue"
                      label="GH₵ per day (platform fee)"
                    />
                  </div>
                  <div className="theme-card">
                    <h2 style={cardTitle}>Monthly platform revenue</h2>
                    <RevenueChart
                      series={overview?.monthly_breakdown || []}
                      valueKey="platform_revenue"
                      label="GH₵ per month (platform fee)"
                    />
                  </div>
                </div>

                <div className="theme-card">
                  <h2 style={cardTitle}>Recent payment activity</h2>
                  <EarningsTable rows={overview?.recent_activity || []} />
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "earnings" && (
          <div className="theme-card">
            <h2 style={cardTitle}>Transaction-level revenue</h2>
            <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#6b7280" }}>
              Gross amounts, Paystack fees (2%), platform fees (8%), and creator net earnings.
            </p>
            <EarningsTable rows={transactions} loading={txLoading} />
            {pagination.pages > 1 && (
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", alignItems: "center" }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  style={pageBtn}
                >
                  Previous
                </button>
                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Page {page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                  style={pageBtn}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="theme-card">
            <h2 style={cardTitle}>Export financial reports</h2>
            <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#6b7280" }}>
              Period: {applied.startDate} → {applied.endDate}. Includes summary totals, fees, payouts,
              and transaction lines.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => handleExport("csv")}
                disabled={exporting}
                style={exportBtn}
              >
                {exporting === "csv" ? "Exporting…" : "Download CSV"}
              </button>
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                disabled={exporting}
                style={{ ...exportBtn, background: "#7c3aed" }}
              >
                {exporting === "pdf" ? "Exporting…" : "Download PDF"}
              </button>
            </div>
            {overview && (
              <div style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "#374151" }}>
                <strong>Preview summary</strong>
                <ul style={{ marginTop: "0.5rem" }}>
                  <li>Platform revenue: {formatCurrency(summary.total_platform_revenue || 0, "GHS")}</li>
                  <li>Gross volume: {formatCurrency(summary.total_gross_volume || 0, "GHS")}</li>
                  <li>Transactions: {summary.transaction_count ?? 0}</li>
                  <li>Completed payouts: {formatCurrency(summary.total_payouts_completed || 0, "GHS")}</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "splits" && (
          <div className="theme-card">
            <h2 style={cardTitle}>Paystack split accounts (future)</h2>
            <p style={{ margin: "0 0 1rem", fontSize: "0.875rem", color: "#6b7280" }}>
              When enabled, payments can allocate platform and creator shares at Paystack instead of
              manual backend settlement. Requires Paystack subaccount codes.
            </p>
            {splitConfig ? (
              <form onSubmit={handleSaveSplits} style={{ maxWidth: 480 }}>
                <label style={label}>
                  <input type="checkbox" name="enabled" defaultChecked={splitConfig.enabled} /> Enable
                  Paystack splits
                </label>
                <label style={label}>
                  Mode
                  <select name="mode" defaultValue={splitConfig.mode} style={input}>
                    <option value="manual">manual (current backend split)</option>
                    <option value="paystack_split">paystack_split</option>
                  </select>
                </label>
                <label style={label}>
                  Platform subaccount code
                  <input
                    name="platform_subaccount_code"
                    defaultValue={splitConfig.platform_subaccount_code || ""}
                    style={input}
                    placeholder="ACCT_xxx"
                  />
                </label>
                <label style={label}>
                  Platform share %
                  <input
                    name="platform_share_percent"
                    type="number"
                    step="0.1"
                    defaultValue={splitConfig.platform_share_percent}
                    style={input}
                  />
                </label>
                <label style={label}>
                  Paystack fee bearer
                  <select name="paystack_fee_bearer" defaultValue={splitConfig.paystack_fee_bearer} style={input}>
                    <option value="account">account</option>
                    <option value="subaccount">subaccount</option>
                    <option value="all-proportional">all-proportional</option>
                  </select>
                </label>
                <label style={label}>
                  Notes
                  <textarea name="notes" defaultValue={splitConfig.notes || ""} rows={3} style={input} />
                </label>
                <button type="submit" style={exportBtn}>
                  Save configuration
                </button>
              </form>
            ) : (
              <p>Loading configuration…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const cardTitle = { margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600 };
const pageBtn = {
  padding: "0.4rem 0.8rem",
  border: "1px solid var(--color-border)",
  borderRadius: "6px",
  background: "var(--color-surface)",
  color: "var(--color-text-primary)",
  cursor: "pointer",
};
const exportBtn = {
  padding: "0.65rem 1.25rem",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: 500,
};
const label = { display: "block", marginBottom: "1rem", fontSize: "0.875rem" };
const input = {
  display: "block",
  width: "100%",
  marginTop: "0.35rem",
  padding: "0.5rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
};
