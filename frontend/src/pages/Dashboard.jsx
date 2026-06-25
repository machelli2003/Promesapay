import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  
  FiHeart,
  FiUsers,
  FiTrendingUp,
  FiEdit2,
  FiExternalLink,
  FiCopy,
  FiCheck,
  FiClock,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
} from "react-icons/fi";
import { BsTrophy } from "react-icons/bs";
import { FaBullseye } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getMyStats } from "../api/profile";
import { getTransactions } from "../api/transactions";
import { getMyCampaigns } from "../api/campaigns";
import { formatCurrency, formatDate } from "../utils/formatters";
import { useLoadingState } from "../hooks/useLoadingState";
import { useToast } from "../hooks/useToast";
import StatsCard from "../components/ui/StatsCard";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";
import Spinner from "../components/ui/Spinner";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { success } = useToast();
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/u/${user?.username}`;

  const { isLoading, error, data, retry } = useLoadingState(
    async () => {
      const [s, t, c] = await Promise.all([
        getMyStats(),
        getTransactions(page),
        getMyCampaigns(),
      ]);
      return {
        stats: s.data.stats,
        transactions: t.data.transactions,
        total: t.data.total,
        campaigns: c.data.campaigns,
      };
    },
    [page]
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = data?.stats || {};
  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const myCampaigns = data?.campaigns || [];

  const goalPct =
    user?.goal_amount > 0
      ? Math.min(Math.round(((stats?.total_raised || 0) / user.goal_amount) * 100), 100)
      : 0;

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted">Failed to load dashboard</p>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.full_name?.split(" ")[0]}`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={FiExternalLink}
              onClick={() => window.open(`/u/${user?.username}`, "_blank")}
            >
              View page
            </Button>
            <Button variant="outline" size="sm" icon={FiEdit2} to="/edit-profile">
              Edit profile
            </Button>
            <Button variant="primary" size="sm" icon={FiPlus} to="/campaigns/new">
              New fundraiser
            </Button>
          </>
        }
      />

      {/* Profile Link Banner */}
      <div className="bg-gold-50 dark:bg-gold-900/10 border border-gold-200 dark:border-gold-800 rounded-xl p-5 mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-600 dark:text-gold-400 mb-2">
          Your support page
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <code className="text-sm font-mono font-medium text-navy-700 dark:text-navy-200 break-all">
            {profileUrl}
          </code>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-navy-700 dark:text-navy-200 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-lg hover:bg-navy-50 dark:hover:bg-navy-700 transition-colors"
          >
            {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold text-navy-900 dark:text-navy-50 mb-4">
          Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Total Raised"
            value={formatCurrency(stats?.total_raised || 0)}
            sub="All time"
            icon={FiTrendingUp}
            color="navy"
          />
          <StatsCard
            label="Supporters"
            value={stats?.total_supporters || 0}
            sub={`${stats?.donation_count || 0} donations · ${stats?.coffee_count || 0} dolls`}
            icon={FiUsers}
            color="purple"
          />
          <StatsCard
            label="Donations"
            value={formatCurrency(stats?.donation_total || 0)}
            sub={`${stats?.donation_count || 0} received`}
            icon={FiHeart}
            color="gold"
          />
          <StatsCard
            label="Doll Tips"
            value={formatCurrency(stats?.coffee_total || 0)}
            sub={`${stats?.total_cups || 0} cups`}
            icon={() => <span className="text-xl">🧸</span>}
            color="green"
          />
        </div>
      </section>

      {/* Goal Progress */}
      {user?.goal_amount > 0 && (
        <section className="mb-8">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  {user.goal_title || "Funding goal"}
                </p>
                <p className="text-sm text-muted">
                  {formatCurrency(stats?.total_raised || 0)} raised of {formatCurrency(user.goal_amount)}
                </p>
              </div>
              <span className="font-heading text-2xl font-bold text-navy-700 dark:text-navy-50">
                {goalPct}%
              </span>
            </div>
            <ProgressBar value={stats?.total_raised || 0} max={user.goal_amount} size="lg" />
            {goalPct >= 100 && (
              <div className="mt-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium text-green-700 dark:text-green-300">
                <BsTrophy className="inline-block mr-1" /> Congratulations! You've reached your goal!
              </div>
            )}
          </Card>
        </section>
      )}

      {/* My Campaigns */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-navy-900 dark:text-navy-50">
            My fundraisers
          </h2>
          <Button variant="outline" size="sm" icon={FiPlus} to="/campaigns/new">
            Create new
          </Button>
        </div>

        {myCampaigns.length === 0 ? (
          <Card className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-800 flex items-center justify-center mx-auto mb-4">
              <FiHeart className="w-6 h-6 text-navy-400" />
            </div>
            <h3 className="text-base font-semibold text-navy-900 dark:text-navy-50 mb-2">
              No fundraisers yet
            </h3>
            <p className="text-sm text-muted mb-6 max-w-xs mx-auto">
              Start your first fundraiser and share it with your supporters.
            </p>
            <Button variant="primary" icon={FiPlus} to="/campaigns/new">
              Start your first fundraiser
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCampaigns.map((c) => (
              <Link key={c._id || c.id} to={`/c/${c.slug}`} className="camp-card block">
                <div
                  className="camp-thumb"
                  style={{
                    background: "linear-gradient(135deg, #1E3A5F, #3B82F6)",
                    height: "140px",
                  }}
                >
                  <FaBullseye className="text-3xl text-white/70" />
                </div>
                <div className="camp-body">
                  <div className="camp-name">{c.title}</div>
                  <div className="progress-bar-wrap mb-3">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${c.goal_amount > 0 ? Math.min((c.raised / c.goal_amount) * 100, 100) : 0}%`,
                      }}
                    />
                  </div>
                  <div className="camp-footer">
                    <span className="camp-raised">
                      <strong>{formatCurrency(c.raised || 0)}</strong> raised
                    </span>
                    <span className="camp-pct">
                      {c.goal_amount > 0 ? Math.round((c.raised / c.goal_amount) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section>
        <h2 className="font-heading text-xl font-bold text-navy-900 dark:text-navy-50 mb-4">
          Recent Transactions
        </h2>
        <Card hover={false} className="overflow-hidden">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-800 flex items-center justify-center mb-4">
                <FiClock className="w-6 h-6 text-navy-400" />
              </div>
              <h3 className="text-base font-semibold text-navy-900 dark:text-navy-50 mb-2">
                No transactions yet
              </h3>
              <p className="text-sm text-muted max-w-xs">
                When someone donates or gets you a doll, it'll show up here.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 dark:divide-navy-700">
                {transactions.map((txn) => (
                  <div key={txn._id || txn.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center text-sm font-semibold text-navy-600 dark:text-navy-300 font-heading flex-shrink-0">
                      {(txn.donor_name || "A")
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 dark:text-navy-50 truncate">
                        {txn.donor_name}
                      </p>
                      <p className="text-xs text-muted">
                        {txn.type === "coffee"
                          ? `Bought ${txn.cups || 1} doll${txn.cups > 1 ? "s" : ""}`
                          : "Made a donation"} {" "}
                        · {timeAgo(txn.created_at)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-navy-900 dark:text-navy-50">
                        {formatCurrency(txn.amount)}
                      </p>
                      <Badge variant={txn.type === "coffee" ? "amber" : "navy"}>
                        {txn.type === "coffee" ? "Doll" : "Donation"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {total > 20 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-navy-700">
                  <span className="text-xs text-muted">
                    Showing {Math.min(page * 20, total)} of {total}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * 20 >= total}
                    >
                      Next
                      <FiChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </section>
    </div>
  );
}