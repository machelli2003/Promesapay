import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProfile } from "../api/profile";
import PaymentModal from "../components/payment/PaymentModal";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { useLoadingState } from "../hooks/useLoadingState";
import { useResponsive } from "../utils/responsiveUtils";
import { useToast } from "../hooks/useToast";
import { FiAlertCircle, FiCheck } from "react-icons/fi";

/* ─── Google Fonts (add to your index.html <head> instead if preferred) ─── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap";
document.head.appendChild(fontLink);

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════ */

function Avatar({ name = "" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div style={styles.avatarRing}>
      <div style={styles.avatar}>{initials}</div>
    </div>
  );
}

function ProfileCard({ user }) {
  return (
    <div style={styles.card}>
      <div style={styles.profileHeader}>
        <Avatar name={user.full_name} />
        <div style={styles.profileMeta}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
            <span style={styles.profileName}>{user.full_name}</span>
            {user.verified && (
              <span style={styles.badgeVerified}>
                <FiCheck size={12} />
                verified
              </span>
            )}
          </div>
          <div style={styles.profileHandle}>@{user.username}</div>
          {user.bio && <div style={styles.profileBio}>{user.bio}</div>}
        </div>
      </div>

      <div style={styles.profileStats}>
        <div style={styles.stat}>
          <span style={styles.statVal}>{user.supporter_count?.toLocaleString() ?? "—"}</span>
          <span style={styles.statLbl}>supporters</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statVal}>${user.total_raised?.toLocaleString() ?? "0"}</span>
          <span style={styles.statLbl}>total raised</span>
        </div>
        {user.monthly_supporters != null && (
          <div style={styles.stat}>
            <span style={styles.statVal}>{user.monthly_supporters}</span>
            <span style={styles.statLbl}>this month</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ raised = 0, goal = 0, title }) {
  const pct = Math.min(Math.round((raised / goal) * 100), 100);
  return (
    <div style={styles.card}>
      {title && <div style={styles.sectionLabel}>Fundraising goal · {title}</div>}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${pct}%` }} />
      </div>
      <div style={styles.progressMeta}>
        <span style={styles.progressRaised}>${raised.toLocaleString()} raised</span>
        <span style={styles.progressPct}>{pct}%</span>
      </div>
      <div style={{ marginTop: 4 }}>
        <span style={styles.progressGoal}>of ${goal.toLocaleString()} goal</span>
      </div>
    </div>
  );
}

const COFFEE_TIERS = [
  { label: "$3", price: 3 },
  { label: "$6", price: 6 },
  { label: "$9", price: 9 },
  { label: "Custom", price: 0 },
];

function CoffeeBox({ onBuy }) {
  const [selected, setSelected] = useState(0);
  const [customAmount, setCustomAmount] = useState("");
  const [note, setNote] = useState("");

  const isCustom = selected === 3;
  const finalAmount = isCustom ? (customAmount ? Number(customAmount) : null) : COFFEE_TIERS[selected].price;
  const canSubmit = isCustom ? finalAmount && finalAmount > 0 : true;

  const handleBuy = () => {
    if (!canSubmit) return;
    onBuy({ amount: finalAmount, note, type: "coffee" });
  };

  return (
    <div style={styles.card}>
      <div style={styles.sectionLabel}>Buy a coffee</div>
      <div style={styles.coffeeGrid}>
        {COFFEE_TIERS.map((t, i) => (
          <button
            key={i}
            onClick={() => {
              setSelected(i);
              setCustomAmount("");
            }}
            style={{
              ...styles.coffeeBtn,
              ...(selected === i ? styles.coffeeBtnActive : {}),
            }}
            onMouseEnter={(e) => {
              if (selected !== i) {
                e.currentTarget.style.background = "var(--color-background-tertiary)";
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== i) {
                e.currentTarget.style.background = "var(--color-background-secondary)";
              }
            }}
          >
            <span style={styles.coffeeEmoji}>☕</span>
            <span
              style={{
                ...styles.coffeePrice,
                ...(selected === i ? styles.coffeePriceActive : {}),
              }}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {isCustom && (
        <input
          type="number"
          min="1"
          placeholder="Amount in dollars"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          style={{ ...styles.donateCustom, marginBottom: 12 }}
        />
      )}

      <textarea
        style={styles.coffeeNote}
        placeholder="Leave a kind note (optional)…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={150}
      />

      <p style={styles.counter}>{note.length}/150</p>

      <button
        style={{
          ...styles.primaryBtn,
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
        onClick={handleBuy}
        disabled={!canSubmit}
        onMouseEnter={(e) => {
          if (canSubmit) e.currentTarget.style.background = "#1450A1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#185FA5";
        }}
      >
        {isCustom
          ? finalAmount
            ? `Buy coffee → $${finalAmount}`
            : "Enter amount"
          : `Buy coffee → ${COFFEE_TIERS[selected].label}`}
      </button>
    </div>
  );
}

const DONATE_AMOUNTS = [5, 10, 25, 50, 100];

function DonateBox({ onDonate }) {
  const [selected, setSelected] = useState(1);
  const [customAmount, setCustomAmount] = useState("");

  const isCustom = customAmount.length > 0;
  const finalAmount = isCustom ? Number(customAmount) : DONATE_AMOUNTS[selected];
  const canSubmit = isCustom ? finalAmount && finalAmount > 0 : true;

  const handleDonate = () => {
    if (!canSubmit) return;
    onDonate({ amount: finalAmount });
  };

  return (
    <div style={styles.card}>
      <div style={styles.sectionLabel}>Make a donation</div>
      <div style={styles.donateAmounts}>
        {DONATE_AMOUNTS.map((amt, i) => (
          <button
            key={amt}
            onClick={() => {
              setSelected(i);
              setCustomAmount("");
            }}
            style={{
              ...styles.amtPill,
              ...(selected === i && !isCustom ? styles.amtPillActive : {}),
            }}
            onMouseEnter={(e) => {
              if (!(selected === i && !isCustom)) {
                e.currentTarget.style.background = "var(--color-background-tertiary)";
                e.currentTarget.style.color = "var(--color-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (!(selected === i && !isCustom)) {
                e.currentTarget.style.background = "var(--color-background-secondary)";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }
            }}
          >
            ${amt}
          </button>
        ))}
      </div>
      <input
        style={styles.donateCustom}
        type="number"
        min="1"
        placeholder="Or enter custom amount…"
        value={customAmount}
        onChange={(e) => setCustomAmount(e.target.value)}
      />
      <button
        style={{
          ...styles.primaryBtn,
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
        onClick={handleDonate}
        disabled={!canSubmit}
        onMouseEnter={(e) => {
          if (canSubmit) e.currentTarget.style.background = "#1450A1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#185FA5";
        }}
      >
        {finalAmount ? `Donate $${finalAmount}` : "Donate"}
      </button>
    </div>
  );
}

const AVATAR_COLORS = [
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#EAF3DE", color: "#3B6D11" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#E6F1FB", color: "#0C447C" },
];

function SupporterAvatar({ name, index }) {
  const { bg, color } = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div style={{ ...styles.supAvatar, background: bg, color }}>
      {initials}
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

function SupportersList({ supporters = [] }) {
  if (!supporters.length) return null;
  return (
    <div style={styles.card}>
      <div style={styles.sectionLabel}>Recent supporters</div>
      <div style={styles.supportersList}>
        {supporters.map((s, i) => (
          <div key={i}>
            {i > 0 && <div style={styles.divider} />}
            <div style={styles.supporter}>
              <SupporterAvatar name={s.donor_name} index={i} />
              <div style={styles.supInfo}>
                <div style={styles.supName}>{s.donor_name || "Anonymous"}</div>
                {s.message && <div style={styles.supMsg}>"{s.message}"</div>}
              </div>
              <div style={styles.supRight}>
                <div style={styles.supAmount}>${s.amount?.toLocaleString()}</div>
                <div style={styles.supTime}>{timeAgo(s.created_at)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  const { username } = useParams();
  const { error } = useToast();
  const { isMobile } = useResponsive();
  const [modal, setModal] = useState(null);

  const { isLoading, error: fetchError, data: profile, retry, setData } = useLoadingState(
    async () => {
      try {
        const res = await getProfile(username);
        return res.data.profile;
      } catch (err) {
        if (err.response?.status === 404) {
          throw new Error("Profile not found");
        }
        throw err;
      }
    },
    [username]
  );

  const handlePaymentSuccess = (result) => {
    const updatedUser = result?.user ?? result;
    setData((p) => ({ ...p, ...updatedUser }));
    setModal(null);
  };

  if (isLoading)
    return (
      <div style={{ ...styles.pageWrap, ...(isMobile && { padding: "1rem" }) }}>
        <SkeletonLoader variant="profile" />
      </div>
    );

  if (fetchError?.message === "Profile not found")
    return (
      <div style={styles.notFoundWrap}>
        <div style={styles.notFoundIcon}>
          <FiAlertCircle size={24} color="var(--color-text-tertiary)" strokeWidth={1.75} />
        </div>
        <div>
          <h2 style={styles.notFoundTitle}>Profile not found</h2>
          <p style={styles.notFoundMsg}>
            <strong>@{username}</strong> doesn't exist on Promesapay.
          </p>
        </div>
        <Link to="/">
          <button
            style={styles.secondaryBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-background-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-background-secondary)";
            }}
          >
            Back to home
          </button>
        </Link>
      </div>
    );

  if (fetchError)
    return (
      <div style={styles.notFoundWrap}>
        <div style={styles.notFoundIcon}>
          <FiAlertCircle size={24} color="var(--color-text-tertiary)" strokeWidth={1.75} />
        </div>
        <div>
          <h2 style={styles.notFoundTitle}>Failed to load profile</h2>
          <p style={styles.notFoundMsg}>
            {fetchError.message || "An error occurred while loading the profile"}
          </p>
        </div>
        <button
          onClick={retry}
          style={styles.secondaryBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--color-background-tertiary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--color-background-secondary)";
          }}
        >
          Try again
        </button>
      </div>
    );

  if (!profile) return null;

  return (
    <div style={{ ...styles.pageWrap, ...(isMobile && { padding: "1rem" }) }}>
      <ProfileCard user={profile} isMobile={isMobile} />

      {profile.goal_amount > 0 && (
        <ProgressBar
          raised={profile.total_raised}
          goal={profile.goal_amount}
          title={profile.goal_title}
        />
      )}

      <CoffeeBox onBuy={(payload) => setModal({ type: "coffee", payload })} isMobile={isMobile} />

      <DonateBox onDonate={(payload) => setModal({ type: "donation", payload })} isMobile={isMobile} />

      <SupportersList supporters={profile.recent_supporters} isMobile={isMobile} />

      {modal && (
        <PaymentModal
          type={modal.type}
          payload={modal.payload}
          recipient={profile}
          onClose={() => setModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */

const styles = {
  pageWrap: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "2rem 1rem",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "1.25rem 1.5rem",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--color-text-tertiary)",
    marginBottom: 10,
  },

  /* Profile */
  profileHeader: { display: "flex", alignItems: "center", gap: 16 },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: "50%",
    border: "1.5px solid var(--color-border-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "#B5D4F4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    fontWeight: 500,
    color: "#0C447C",
  },
  profileMeta: { flex: 1 },
  profileName: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 22,
    color: "var(--color-text-primary)",
    lineHeight: 1.2,
  },
  badgeVerified: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 11,
    color: "#185FA5",
    background: "#E6F1FB",
    padding: "2px 8px",
    borderRadius: 100,
    marginLeft: 6,
  },
  profileHandle: { fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 5, marginTop: 2 },
  profileBio: { fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 },
  profileStats: {
    display: "flex",
    gap: 20,
    marginTop: 14,
    paddingTop: 14,
    borderTop: "0.5px solid var(--color-border-tertiary)",
  },
  stat: { display: "flex", flexDirection: "column", gap: 1 },
  statVal: { fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" },
  statLbl: { fontSize: 12, color: "var(--color-text-secondary)" },

  /* Progress */
  progressTrack: {
    height: 6,
    background: "var(--color-background-secondary)",
    borderRadius: 100,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", background: "#378ADD", borderRadius: 100, transition: "width .4s ease" },
  progressMeta: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  progressRaised: { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" },
  progressPct: {
    fontSize: 11,
    fontWeight: 500,
    color: "#185FA5",
    background: "#E6F1FB",
    padding: "2px 8px",
    borderRadius: 100,
  },
  progressGoal: { fontSize: 13, color: "var(--color-text-secondary)" },

  /* Coffee */
  coffeeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))", gap: 8, marginBottom: 12 },
  coffeeBtn: {
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 8,
    padding: "10px 6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
    transition: "border-color .15s, background .15s",
  },
  coffeeBtnActive: { borderColor: "#378ADD", background: "#E6F1FB" },
  coffeeEmoji: { fontSize: 18, lineHeight: 1 },
  coffeePrice: { fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)" },
  coffeePriceActive: { color: "#185FA5" },
  coffeeNote: {
    width: "100%",
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--color-text-primary)",
    resize: "vertical",
    outline: "none",
    height: 72,
    lineHeight: 1.5,
    boxSizing: "border-box",
    transition: "border-color .15s",
  },

  /* Donate */
  donateAmounts: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  amtPill: {
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 100,
    padding: "7px 16px",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    cursor: "pointer",
    transition: "border-color .15s, background .15s, color .15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  amtPillActive: { borderColor: "#378ADD", background: "#E6F1FB", color: "#185FA5" },
  donateCustom: {
    width: "100%",
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--color-text-primary)",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color .15s",
  },

  /* Primary / Secondary buttons */
  primaryBtn: {
    width: "100%",
    background: "#185FA5",
    color: "#fff",
    border: "none",
    borderRadius: "var(--border-radius-md)",
    padding: "12px",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    marginTop: 10,
    transition: "background .15s",
  },
  secondaryBtn: {
    background: "var(--color-background-secondary)",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: "var(--border-radius-md)",
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    color: "var(--color-text-primary)",
  },
  counter: {
    fontSize: 12,
    color: "var(--color-text-tertiary)",
    textAlign: "right",
    marginTop: 6,
    marginBottom: 12,
  },

  /* Supporters */
  supportersList: { display: "flex", flexDirection: "column", gap: 10 },
  supporter: { display: "flex", alignItems: "center", gap: 12 },
  supAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 500,
    flexShrink: 0,
  },
  supInfo: { flex: 1 },
  supName: { fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" },
  supMsg: { fontSize: 12, color: "var(--color-text-secondary)", marginTop: 1 },
  supRight: { textAlign: "right" },
  supAmount: { fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" },
  supTime: { fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 },
  divider: { height: "0.5px", background: "var(--color-border-tertiary)", margin: "6px 0" },

  /* Not found */
  notFoundWrap: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: "0 1rem",
    textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
  },
  notFoundIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "var(--color-background-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundTitle: { fontSize: 18, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 4 },
  notFoundMsg: { fontSize: 14, color: "var(--color-text-secondary)" },
};