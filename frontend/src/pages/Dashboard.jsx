import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCoffee,
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
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getMyStats } from "../api/profile";
import { getTransactions } from "../api/transactions";
import { getMyCampaigns } from "../api/campaigns";
import CampaignCard from "../components/campaigns/CampaignCard";
import { formatCurrency, formatDate } from "../utils/formatters";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { useLoadingState } from "../hooks/useLoadingState";
import { useToast } from "../hooks/useToast";

/* ─── Fonts ─────────────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap";
document.head.appendChild(fontLink);

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

function Avatar({ name = "", size = 40 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    { bg: "#E1F5EE", color: "#0F6E56" },
    { bg: "#FAEEDA", color: "#854F0B" },
    { bg: "#FBEAF0", color: "#993556" },
    { bg: "#EAF3DE", color: "#3B6D11" },
    { bg: "#EEEDFE", color: "#3C3489" },
    { bg: "#E6F1FB", color: "#0C447C" },
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colors[idx].bg,
        color: colors[idx].color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

/* ═══════════════════════════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════════════════════════ */

function Card({ children, style }) {
  return <div style={{ ...S.card, ...style }}>{children}</div>;
}

function SectionHeading({ children }) {
  return <h2 style={S.sectionHeading}>{children}</h2>;
}

function Btn({ children, onClick, disabled, variant = "primary", size = "md", icon: Icon, to, target }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    border: "none",
    borderRadius: 8,
    transition: "background .15s, border-color .15s",
    whiteSpace: "nowrap",
    textDecoration: "none",
    fontSize: size === "sm" ? 13 : 14,
    padding: size === "sm" ? "7px 14px" : "10px 18px",
    ...(variant === "primary"
      ? { background: "#185FA5", color: "#fff" }
      : {
          background: "var(--color-background-secondary)",
          color: "var(--color-text-primary)",
          border: "0.5px solid var(--color-border-secondary)",
        }),
  };
  const inner = (
    <>
      {Icon && <Icon size={size === "sm" ? 13 : 15} strokeWidth={2} />}
      {children}
    </>
  );
  if (to)
    return (
      <Link to={to} target={target} style={base}>
        {inner}
      </Link>
    );
  return (
    <button style={base} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════════════════════════ */

const iconThemes = {
  sky:    { bg: "#E6F1FB", color: "#185FA5" },
  purple: { bg: "#EEEDFE", color: "#3C3489" },
  rose:   { bg: "#FBEAF0", color: "#993556" },
  amber:  { bg: "#FAEEDA", color: "#854F0B" },
};

function StatCard({ label, value, sub, icon: Icon, iconColor = "sky" }) {
  const theme = iconThemes[iconColor];
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ ...S.iconBox, background: theme.bg }}>
          <Icon size={16} color={theme.color} strokeWidth={2} />
        </div>
      </div>
      <div style={S.statValue}>{value}</div>
      <div style={S.statLabel}>{label}</div>
      {sub && <div style={S.statSub}>{sub}</div>}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE LINK BANNER
═══════════════════════════════════════════════════════════════ */

function ProfileBanner({ profileUrl, copied, onCopy }) {
  return (
    <div style={S.banner}>
      <div style={S.bannerLabel}>Your support page</div>
      <div style={S.bannerRow}>
        <span style={S.bannerUrl}>{profileUrl}</span>
        <Btn variant="secondary" size="sm" icon={copied ? FiCheck : FiCopy} onClick={onCopy}>
          {copied ? "Copied!" : "Copy link"}
        </Btn>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOAL PROGRESS
═══════════════════════════════════════════════════════════════ */

function GoalProgress({ title, raised, goal, pct }) {
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={S.sectionLabel}>{title || "Funding goal"}</div>
          <div style={{ fontSize: 14, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {formatCurrency(raised)} raised of {formatCurrency(goal)}
          </div>
        </div>
        <span style={S.goalPct}>{pct}%</span>
      </div>
      <div style={S.progressTrack}>
        <div style={{ ...S.progressFill, width: `${pct}%` }} />
      </div>
      {pct >= 100 && (
        <div style={S.goalReached}>🎉 Congratulations! You've reached your goal!</div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TRANSACTIONS TABLE
═══════════════════════════════════════════════════════════════ */

function TxnBadge({ type }) {
  const isCoffee = type === "coffee";
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 100,
        background: isCoffee ? "#FAEEDA" : "#E6F1FB",
        color: isCoffee ? "#854F0B" : "#185FA5",
      }}
    >
      {type}
    </span>
  );
}

function TransactionRow({ txn }) {
  return (
    <div style={S.txnRow}>
      <Avatar name={txn.donor_name} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={S.txnName}>{txn.donor_name}</div>
        <div style={S.txnMeta}>
          {txn.type === "coffee"
            ? `Bought ${txn.cups} coffee${txn.cups > 1 ? "s" : ""}`
            : "Made a donation"}{" "}
          · {formatDate(txn.created_at)}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={S.txnAmount}>{formatCurrency(txn.amount)}</div>
        <div style={{ marginTop: 4 }}>
          <TxnBadge type={txn.type} />
        </div>
      </div>
    </div>
  );
}

function EmptyTransactions() {
  return (
    <div style={S.emptyState}>
      <div style={S.emptyIcon}>
        <FiClock size={22} color="var(--color-text-tertiary)" strokeWidth={1.5} />
      </div>
      <div style={S.emptyTitle}>No transactions yet</div>
      <div style={S.emptyDesc}>
        When someone donates or buys you a coffee, it'll show up here.
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAMPAIGNS EMPTY STATE
═══════════════════════════════════════════════════════════════ */

function EmptyCampaigns() {
  return (
    <Card style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
      <div style={S.emptyIcon}>
        <FiHeart size={22} color="var(--color-text-tertiary)" strokeWidth={1.5} />
      </div>
      <div style={S.emptyTitle}>No fundraisers yet</div>
      <div style={{ ...S.emptyDesc, marginBottom: 20 }}>
        Start your first fundraiser and share it with your supporters.
      </div>
      <Btn to="/campaigns/new" icon={FiPlus}>
        Start your first fundraiser
      </Btn>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const { user } = useAuth();
  const { success } = useToast();
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);

  const profileUrl = `${window.location.origin}/u/${user?.username}`;

  // Use the new loading state hook for initial data fetch
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

  if (isLoading)
    return (
      <div style={S.pageWrap}>
        <SkeletonLoader variant="card" />
      </div>
    );

  if (error)
    return (
      <div style={S.pageWrap}>
        <div style={S.errorState}>
          <p style={{ color: "var(--color-text-secondary)" }}>Failed to load dashboard</p>
          <button 
            onClick={retry}
            style={{
              marginTop: 12,
              padding: "8px 16px",
              background: "#185FA5",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );

  return (
    <div style={S.pageWrap}>

      {/* ── Page header ── */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.pageTitle}>Dashboard</h1>
          <p style={S.pageSubtitle}>
            Welcome back, {user?.full_name?.split(" ")[0]} 👋
          </p>
        </div>
        <div style={S.headerActions}>
          <Btn variant="secondary" size="sm" icon={FiExternalLink} to={`/u/${user?.username}`} target="_blank">
            View page
          </Btn>
          <Btn size="sm" icon={FiPlus} to="/campaigns/new">
            New fundraiser
          </Btn>
          <Btn variant="secondary" size="sm" icon={FiEdit2} to="/edit-profile">
            Edit profile
          </Btn>
        </div>
      </div>

      {/* ── Profile link banner ── */}
      <ProfileBanner profileUrl={profileUrl} copied={copied} onCopy={handleCopy} />

      {/* ── Stats grid ── */}
      <section style={{ marginBottom: 32 }}>
        <SectionHeading>Performance</SectionHeading>
        <div style={S.statsGrid}>
          <StatCard
            label="Total Raised"
            value={formatCurrency(stats?.total_raised || 0)}
            sub="All time"
            icon={FiTrendingUp}
            iconColor="sky"
          />
          <StatCard
            label="Supporters"
            value={stats?.total_supporters || 0}
            sub={`${stats?.donation_count || 0} donations · ${stats?.coffee_count || 0} coffees`}
            icon={FiUsers}
            iconColor="purple"
          />
          <StatCard
            label="Donations"
            value={formatCurrency(stats?.donation_total || 0)}
            sub={`${stats?.donation_count || 0} received`}
            icon={FiHeart}
            iconColor="rose"
          />
          <StatCard
            label="Coffee Tips"
            value={formatCurrency(stats?.coffee_total || 0)}
            sub={`${stats?.total_cups || 0} cups`}
            icon={FiCoffee}
            iconColor="amber"
          />
        </div>
      </section>

      {/* ── Goal progress ── */}
      {user?.goal_amount > 0 && (
        <section style={{ marginBottom: 32 }}>
          <GoalProgress
            title={user.goal_title}
            raised={stats?.total_raised || 0}
            goal={user.goal_amount}
            pct={goalPct}
          />
        </section>
      )}

      {/* ── My fundraisers ── */}
      <section style={{ marginBottom: 32 }}>
        <div style={S.sectionRow}>
          <SectionHeading>My fundraisers</SectionHeading>
          <Btn variant="secondary" size="sm" icon={FiPlus} to="/campaigns/new">
            Create new
          </Btn>
        </div>
        {myCampaigns.length === 0 ? (
          <EmptyCampaigns />
        ) : (
          <div style={S.campaignsGrid}>
            {myCampaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent transactions ── */}
      <section>
        <SectionHeading>Recent Transactions</SectionHeading>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {transactions.length === 0 ? (
            <EmptyTransactions />
          ) : (
            <>
              <div>
                {transactions.map((txn, i) => (
                  <div key={txn.id}>
                    {i > 0 && <div style={S.divider} />}
                    <TransactionRow txn={txn} />
                  </div>
                ))}
              </div>

              {total > 20 && (
                <div style={S.pagination}>
                  <span style={S.paginationInfo}>
                    Showing {Math.min(page * 20, total)} of {total}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn
                      variant="secondary"
                      size="sm"
                      icon={FiChevronLeft}
                      onClick={() => setPage((p) => p - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Btn>
                    <Btn
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * 20 >= total}
                    >
                      Next
                      <ChevronRight size={13} strokeWidth={2} />
                    </Btn>
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

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */

const S = {
  pageWrap: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "2.5rem 1.5rem",
    fontFamily: "'DM Sans', sans-serif",
  },

  /* Header */
  pageHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 28,
  },
  pageTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 34,
    color: "var(--color-text-primary)",
    lineHeight: 1.15,
    margin: 0,
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: "var(--color-text-secondary)",
  },
  headerActions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },

  /* Banner */
  banner: {
    marginBottom: 32,
    borderRadius: 12,
    border: "0.5px solid #BAD9F5",
    background: "#E6F1FB",
    padding: "18px 20px",
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#185FA5",
    marginBottom: 6,
  },
  bannerRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  bannerUrl: {
    fontFamily: "monospace",
    fontSize: 13,
    fontWeight: 500,
    color: "#0C447C",
    wordBreak: "break-all",
  },

  /* Section */
  sectionHeading: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    color: "var(--color-text-primary)",
    margin: "0 0 16px 0",
  },
  sectionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-tertiary)",
    marginBottom: 4,
  },

  /* Card */
  card: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: "1.25rem 1.5rem",
  },

  /* Stats */
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: "var(--color-text-primary)",
    lineHeight: 1.1,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-secondary)",
  },
  statSub: {
    fontSize: 12,
    color: "var(--color-text-tertiary)",
    marginTop: 3,
  },

  /* Goal */
  goalPct: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: "#185FA5",
    lineHeight: 1,
  },
  progressTrack: {
    height: 6,
    background: "var(--color-background-secondary)",
    borderRadius: 100,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    background: "#378ADD",
    borderRadius: 100,
    transition: "width .5s ease",
  },
  goalReached: {
    marginTop: 10,
    borderRadius: 8,
    background: "#EDFAF3",
    padding: "10px 14px",
    fontSize: 14,
    fontWeight: 500,
    color: "#0F6E56",
  },

  /* Campaigns */
  campaignsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
  },

  /* Transactions */
  txnRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "14px 20px",
  },
  txnName: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  txnMeta: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
    marginTop: 2,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--color-text-primary)",
  },
  divider: {
    height: "0.5px",
    background: "var(--color-border-tertiary)",
    margin: "0 20px",
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 20px",
    borderTop: "0.5px solid var(--color-border-tertiary)",
  },
  paginationInfo: {
    fontSize: 12,
    color: "var(--color-text-secondary)",
  },

  /* Empty */
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 1.5rem",
    textAlign: "center",
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "var(--color-background-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: "var(--color-text-secondary)",
    lineHeight: 1.6,
    maxWidth: 320,
  },
};