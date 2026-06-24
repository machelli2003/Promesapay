import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../../api/admin";
import { formatCurrency } from "../../utils/formatters";

function StatCard({ label, value, accent }) {
  return (
    <div className="theme-card" style={{ padding: "1.25rem" }}>
      <p className="theme-muted m-0 text-sm">{label}</p>
      <p className="m-0 mt-3 text-3xl font-bold" style={{ color: accent || undefined }}>
        {value}
      </p>
    </div>
  );
}

function ActionCard({ title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="theme-card text-left"
      style={{ padding: "1.5rem", width: "100%", textAlign: "left" }}
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm">{description}</p>
    </button>
  );
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAdminStats();
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const userStats = stats?.users || {};
  const paymentStats = stats?.payments || {};

  return (
    <div className="theme-page px-4 py-8 sm:px-8">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 700 }}>Admin Center</h1>
          <p className="theme-muted m-0 text-sm">
            Core administrative controls and system metrics for managing users, finance, disputes, and monitoring.
          </p>
        </header>

        <div className="theme-card mb-6" style={{ padding: "1.5rem" }}>
          <h2 className="text-xl font-semibold mb-3">Quick admin actions</h2>
          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <ActionCard
              title="User management"
              description="View all users, search accounts, and manage status."
              onClick={() => navigate("/admin/users")}
            />
            <ActionCard
              title="Finance dashboard"
              description="Monitor revenue, export reports, and control Paystack split settings."
              onClick={() => navigate("/admin/finance")}
            />
            <ActionCard
              title="Payout queue"
              description="Review withdrawal requests and update payout status."
              onClick={() => navigate("/admin/payouts")}
            />
            <ActionCard
              title="Dispute resolution"
              description="Resolve disputes and issue refunds where needed."
              onClick={() => navigate("/admin/disputes")}
            />
            <ActionCard
              title="System monitoring"
              description="Check system health, alerts, and platform metrics."
              onClick={() => navigate("/admin/monitoring")}
            />
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1rem" }}>Admin summary</h2>
          {loading ? (
            <p>Loading admin summary…</p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              }}
            >
              <StatCard label="Total users" value={userStats.total ?? 0} accent="#0f766e" />
              <StatCard label="Active users" value={userStats.active ?? 0} accent="#1d4ed8" />
              <StatCard label="Suspended users" value={userStats.suspended ?? 0} accent="#c2410c" />
              <StatCard label="Verified email" value={userStats.verified_email ?? 0} accent="#059669" />
              <StatCard label="2FA enabled" value={userStats.two_factor_enabled ?? 0} accent="#2563eb" />
              <StatCard label="Total transactions" value={paymentStats.total_transactions ?? 0} accent="#7c3aed" />
              <StatCard
                label="Successful transactions"
                value={paymentStats.successful_transactions ?? 0}
              />
              <StatCard
                label="Total revenue"
                value={formatCurrency(paymentStats.total_revenue ?? 0, "GHS")}
                accent="#047857"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
