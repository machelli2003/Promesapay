import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Coffee,
  Heart,
  Users,
  TrendingUp,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getMyStats } from "../api/profile";
import { getTransactions } from "../api/transactions";
import { formatCurrency, formatDate } from "../utils/formatters";
import StatCard from "../components/ui/StatCard";
import AppButton from "../components/ui/AppButton";
import SectionContainer from "../components/ui/SectionContainer";
import { AppCard, CardHeader, CardBody } from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import Avatar from "../components/ui/Avatar";
import { DashboardSkeleton } from "../components/common/Skeleton";
import { useToast } from "../hooks/useToast";

export default function Dashboard() {
  const { user } = useAuth();
  const { success } = useToast();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/u/${user?.username}`;

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([getMyStats(), getTransactions(page)]);
        setStats(s.data.stats);
        setTransactions(t.data.transactions);
        setTotal(t.data.total);
      } finally {
        setLoading(false);
      }
    })();
  }, [page]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const goalPct =
    user?.goal_amount > 0
      ? Math.min(
          Math.round(
            ((stats?.total_raised || 0) / user.goal_amount) * 100
          ),
          100
        )
      : 0;

  if (loading)
    return (
      <div className="page-wrapper">
        <DashboardSkeleton />
      </div>
    );

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Page header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
            Dashboard
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Welcome back, {user?.full_name?.split(" ")[0]} 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/u/${user?.username}`} target="_blank">
            <AppButton variant="secondary" size="sm" icon={ExternalLink}>
              View page
            </AppButton>
          </Link>
          <Link to="/edit-profile">
            <AppButton size="sm" icon={Edit2}>
              Edit profile
            </AppButton>
          </Link>
        </div>
      </div>

      {/* Profile link banner */}
      <div className="mb-8 rounded-xl border border-violet-200 bg-violet-50 p-6 dark:border-violet-900 dark:bg-violet-900/20">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Your support page
        </p>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="truncate font-mono text-sm font-medium text-violet-900 dark:text-violet-100">
            {profileUrl}
          </p>
          <AppButton
            variant="secondary"
            size="sm"
            icon={copied ? Check : Copy}
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? "Copied!" : "Copy link"}
          </AppButton>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-8">
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-50">
          Performance
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Raised"
            value={formatCurrency(stats?.total_raised || 0)}
            sub="All time"
            icon={TrendingUp}
            iconColor="violet"
            trend="up"
            trendLabel="Lifetime earnings"
          />
          <StatCard
            label="Supporters"
            value={stats?.total_supporters || 0}
            sub={`${stats?.donation_count || 0} donations · ${stats?.coffee_count || 0} coffees`}
            icon={Users}
            iconColor="purple"
          />
          <StatCard
            label="Donations"
            value={formatCurrency(stats?.donation_total || 0)}
            sub={`${stats?.donation_count || 0} received`}
            icon={Heart}
            iconColor="rose"
          />
          <StatCard
            label="Coffee Tips"
            value={formatCurrency(stats?.coffee_total || 0)}
            sub={`${stats?.total_cups || 0} cups`}
            icon={Coffee}
            iconColor="amber"
          />
        </div>
      </div>

      {/* Goal progress */}
      {user?.goal_amount > 0 && (
        <div className="mb-8">
          <AppCard>
            <CardHeader
              title={user.goal_title || "Funding goal"}
              subtitle={`${formatCurrency(stats?.total_raised || 0)} raised of ${formatCurrency(user.goal_amount)}`}
              action={
                <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {goalPct}%
                </span>
              }
            />
            <CardBody className="space-y-4">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${goalPct}%` }} />
              </div>
              {goalPct >= 100 && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  🎉 Congratulations! You've reached your goal!
                </div>
              )}
            </CardBody>
          </AppCard>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-50">
          Recent Transactions
        </h2>
        <AppCard>
          {transactions.length === 0 ? (
            <CardBody>
              <EmptyState
                icon={Clock}
                title="No transactions yet"
                description="When someone donates or buys you a coffee, it'll show up here."
              />
            </CardBody>
          ) : (
            <>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Avatar name={txn.donor_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                        {txn.donor_name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-400">
                        {txn.type === "coffee"
                          ? `Bought ${txn.cups} coffee${
                              txn.cups > 1 ? "s" : ""
                            }`
                          : "Made a donation"}{" "}
                        · {formatDate(txn.created_at)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        {formatCurrency(txn.amount)}
                      </p>
                      <span
                        className={`mt-1 badge ${
                          txn.type === "coffee"
                            ? "badge-amber"
                            : "badge-violet"
                        }`}
                      >
                        {txn.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {total > 20 && (
                <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Showing {Math.min(page * 20, total)} of {total}
                    </p>
                    <div className="flex gap-2">
                      <AppButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page <= 1}
                      >
                        Previous
                      </AppButton>
                      <AppButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page * 20 >= total}
                      >
                        Next
                      </AppButton>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </AppCard>
      </div>
    </div>
  );
}