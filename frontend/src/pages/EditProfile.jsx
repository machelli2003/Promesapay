import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiTarget, FiShare2, FiSave, FiAlertCircle } from "react-icons/fi";
import { updateProfile } from "../api/profile";
import { useAuth } from "../context/AuthContext";
import { useResponsive } from "../utils/responsiveUtils";
import { useToast } from "../hooks/useToast";

/* ─── Fonts ─────────────────────────────────────────────────── */
if (!document.querySelector("#edit-profile-fonts")) {
  const l = document.createElement("link");
  l.id = "edit-profile-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap";
  document.head.appendChild(l);
}

/* ═══════════════════════════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════════════════════════ */

function Card({ children, style }) {
  return <div style={{ ...S.card, ...style }}>{children}</div>;
}

function InputField({ label, name, type = "text", value, onChange, placeholder, hint, maxLength, prefix, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>
        {label}
        {!required && <span style={S.optional}>(optional)</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={4}
          maxLength={maxLength}
          style={S.textarea}
        />
      ) : (
        <div style={{ position: "relative" }}>
          {prefix && <span style={S.prefix}>{prefix}</span>}
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            style={{ ...S.input, ...(prefix ? { paddingLeft: 32 } : {}) }}
          />
        </div>
      )}
      {hint && <p style={S.hint}>{hint}</p>}
      {maxLength && (
        <p style={S.counter}>
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div style={S.sectionIcon}>
          <Icon size={18} strokeWidth={1.75} color="var(--color-text-secondary)" />
        </div>
        <div>
          <h3 style={S.sectionTitle}>{title}</h3>
          {subtitle && <p style={S.sectionSubtitle}>{subtitle}</p>}
        </div>
      </div>
      <div>{children}</div>
    </Card>
  );
}

function Btn({ children, onClick, type = "button", variant = "primary", loading, icon: Icon, disabled }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "12px 18px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "background .15s, border-color .15s",
  };

  const styles =
    variant === "primary"
      ? { background: "#185FA5", color: "#fff" }
      : {
          background: "var(--color-background-secondary)",
          color: "var(--color-text-primary)",
          border: "0.5px solid var(--color-border-secondary)",
        };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{ ...base, ...styles }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          if (variant === "primary") {
            e.currentTarget.style.background = "#1450A1";
          } else {
            e.currentTarget.style.background = "var(--color-background-tertiary)";
          }
        }
      }}
      onMouseLeave={(e) => {
        if (variant === "primary") {
          e.currentTarget.style.background = "#185FA5";
        } else {
          e.currentTarget.style.background = "var(--color-background-secondary)";
        }
      }}
    >
      {Icon && !loading && <Icon size={16} strokeWidth={2} />}
      {loading ? "Saving..." : children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */

export default function EditProfile() {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    bio: "",
    profile_picture: "",
    goal_amount: "",
    goal_title: "",
    social_links: { twitter: "", instagram: "", website: "" },
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        bio: user.bio || "",
        profile_picture: user.profile_picture || "",
        goal_amount: user.goal_amount || "",
        goal_title: user.goal_title || "",
        social_links: user.social_links || { twitter: "", instagram: "", website: "" },
      });
    }
  }, [user]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const setSocial = (e) =>
    setForm((f) => ({
      ...f,
      social_links: { ...f.social_links, [e.target.name]: e.target.value },
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfile(form);
      updateUser(res.data.user);
      success("Profile updated!");
      navigate(`/u/${user.username}`);
    } catch (err) {
      error(err.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...S.pageWrap, ...(isMobile && { padding: "1.5rem 1rem" }) }}>
      {/* Page header */}
      <div style={S.header}>
        <h1 style={{ ...S.pageTitle, ...(isMobile && { fontSize: 24 }) }}>Edit profile</h1>
        <p style={S.pageSubtitle}>Customize your public support page</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Basic info */}
        <SectionCard icon={FiUser} title="Basic info" subtitle="Your public name and bio">
          <InputField
            label="Full name"
            name="full_name"
            value={form.full_name}
            onChange={set}
            placeholder="Your full name"
            required
          />
          <InputField
            label="Bio"
            name="bio"
            type="textarea"
            value={form.bio}
            onChange={set}
            placeholder="Tell your supporters about yourself..."
            maxLength={200}
          />
          <InputField
            label="Profile picture URL"
            name="profile_picture"
            value={form.profile_picture}
            onChange={set}
            placeholder="https://..."
            hint="Paste a direct image URL"
          />
          {form.profile_picture && (
            <div style={{ marginTop: 12 }}>
              <img
                src={form.profile_picture}
                alt="Preview"
                style={{
                  width: isMobile ? 56 : 64,
                  height: isMobile ? 56 : 64,
                  borderRadius: 8,
                  objectFit: "cover",
                  border: "0.5px solid var(--color-border-tertiary)",
                }}
              />
            </div>
          )}
        </SectionCard>

        {/* Funding goal */}
        <SectionCard
          icon={FiTarget}
          title="Funding goal"
          subtitle="Set a target for supporters to work toward"
        >
          <InputField
            label="Goal title"
            name="goal_title"
            value={form.goal_title}
            onChange={set}
            placeholder="e.g. Fund my debut album"
          />
          <InputField
            label="Goal amount (GH₵)"
            name="goal_amount"
            type="number"
            value={form.goal_amount}
            onChange={set}
            placeholder="0.00"
            prefix="GH₵"
          />
        </SectionCard>

        {/* Social links */}
        <SectionCard
          icon={FiShare2}
          title="Social links"
          subtitle="Help supporters find you elsewhere"
        >
          {[
            { name: "twitter", label: "Twitter", placeholder: "username (without @)" },
            { name: "instagram", label: "Instagram", placeholder: "username (without @)" },
            { name: "website", label: "Website", placeholder: "https://yoursite.com" },
          ].map((s) => (
            <InputField
              key={s.name}
              label={s.label}
              name={s.name}
              value={form.social_links[s.name]}
              onChange={setSocial}
              placeholder={s.placeholder}
            />
          ))}
        </SectionCard>

        {/* Actions */}
        <div style={{ ...S.actions, ...(isMobile && { flexDirection: "column-reverse", gap: 12 }) }}>
          <Btn variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Btn>
          <Btn type="submit" loading={loading} icon={FiSave}>
            Save changes
          </Btn>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */

const S = {
  pageWrap: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "2.5rem 1.5rem",
    fontFamily: "'DM Sans', sans-serif",
  },

  /* Header */
  header: {
    marginBottom: 28,
  },
  pageTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    fontWeight: 500,
    color: "var(--color-text-primary)",
    lineHeight: 1.2,
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 15,
    color: "var(--color-text-secondary)",
    marginTop: 6,
  },

  /* Card */
  card: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: 12,
    padding: "1.5rem",
  },

  /* Section */
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "var(--color-background-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--color-text-primary)",
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "var(--color-text-secondary)",
    marginTop: 4,
  },

  /* Input */
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-text-secondary)",
    marginBottom: 8,
    fontFamily: "'DM Sans', sans-serif",
  },
  optional: {
    fontWeight: 400,
    color: "var(--color-text-tertiary)",
    marginLeft: 4,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "0.5px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    transition: "border-color .15s",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "0.5px solid var(--color-border-tertiary)",
    background: "var(--color-background-secondary)",
    color: "var(--color-text-primary)",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    outline: "none",
    transition: "border-color .15s",
    resize: "vertical",
    boxSizing: "border-box",
  },
  prefix: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--color-text-tertiary)",
    pointerEvents: "none",
  },
  hint: {
    fontSize: 12,
    color: "var(--color-text-tertiary)",
    marginTop: 6,
  },
  counter: {
    fontSize: 12,
    color: "var(--color-text-tertiary)",
    textAlign: "right",
    marginTop: 4,
  },

  /* Actions */
  actions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },
};