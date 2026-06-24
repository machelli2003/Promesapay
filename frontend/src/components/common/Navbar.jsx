import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiMoon,
  FiSun,
  FiLayout,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiMenu,
  FiX,
  FiSearch,
  FiPlus,
  FiDollarSign,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useState, useRef, useEffect } from "react";
import BrandLogo from "./BrandLogo";
import NotificationBell from "./NotificationBell";

/* ─── Fonts (add to index.html instead if preferred) ───────── */
if (!document.querySelector("#promesa-fonts")) {
  const l = document.createElement("link");
  l.id = "promesa-fonts";
  l.rel = "stylesheet";
  l.href =
    "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap";
  document.head.appendChild(l);
}

/* ═══════════════════════════════════════════════════════════════
   SMALL PRIMITIVES
═══════════════════════════════════════════════════════════════ */

function IconBtn({ children, onClick, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        borderRadius: 8,
        border: "none",
        background: "transparent",
        color: "var(--color-text-secondary)",
        cursor: "pointer",
        transition: "background .15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--color-background-secondary)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {children}
    </button>
  );
}

function NavLink({ to, href, children }) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--color-text-secondary)",
    textDecoration: "none",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "background .15s, color .15s",
    whiteSpace: "nowrap",
  };
  const hover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.background = "var(--color-background-secondary)";
      e.currentTarget.style.color = "var(--color-text-primary)";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "var(--color-text-secondary)";
    },
  };
  if (href)
    return (
      <a href={href} style={base} {...hover}>
        {children}
      </a>
    );
  return (
    <Link to={to} style={base} {...hover}>
      {children}
    </Link>
  );
}

function MobileNavLink({ to, href, children, onClick }) {
  const base = {
    display: "block",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    color: "var(--color-text-secondary)",
    textDecoration: "none",
    transition: "background .15s, color .15s",
  };
  const hover = {
    onMouseEnter: (e) => {
      e.currentTarget.style.background = "var(--color-background-secondary)";
      e.currentTarget.style.color = "var(--color-text-primary)";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "var(--color-text-secondary)";
    },
  };
  if (href)
    return (
      <a href={href} style={base} {...hover} onClick={onClick}>
        {children}
      </a>
    );
  return (
    <Link to={to} style={base} {...hover} onClick={onClick}>
      {children}
    </Link>
  );
}

function DropItem({ to, icon: Icon, children, onClick, danger }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        margin: "0 4px",
        borderRadius: 7,
        fontSize: 13.5,
        fontFamily: "'DM Sans', sans-serif",
        color: danger ? "#E53E3E" : "var(--color-text-secondary)",
        textDecoration: "none",
        transition: "background .12s, color .12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "rgba(229,62,62,.08)"
          : "var(--color-background-secondary)";
        e.currentTarget.style.color = danger ? "#E53E3E" : "var(--color-text-primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = danger ? "#E53E3E" : "var(--color-text-secondary)";
      }}
    >
      {Icon && <Icon size={15} strokeWidth={1.75} />}
      {children}
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AVATAR
═══════════════════════════════════════════════════════════════ */

function Avatar({ name = "", src, size = 28 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src)
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--color-avatar-bg)",
        color: "var(--color-avatar-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NAVBAR
═══════════════════════════════════════════════════════════════ */

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => setMobileOpen(false), [location.pathname]);

  /* Scroll shadow */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = user
    ? [
        { to: "/campaigns", label: "Browse" },
        { to: "/dashboard", label: "Dashboard" },
        { to: "/campaigns/new", label: "Start fundraiser" },
      ]
    : [
        { to: "/campaigns", label: "Browse" },
        { href: "#features", label: "Features" },
        { href: "#how-it-works", label: "How it works" },
      ];

  /* ─── Styles ────────────────────────────────────────────── */
  const headerStyle = {
    position: "sticky",
    top: 0,
    zIndex: 50,
    fontFamily: "'DM Sans', sans-serif",
    background: "var(--color-nav-bg)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: scrolled
      ? `0.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`
      : "0.5px solid transparent",
    boxShadow: scrolled
      ? dark
        ? "0 4px 24px rgba(0,0,0,0.4)"
        : "0 4px 24px rgba(0,0,0,0.06)"
      : "none",
    transition: "box-shadow .25s, border-color .25s",
  };

  const innerStyle = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 1.25rem",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    position: "relative",
  };

  const dropdownStyle = {
    position: "absolute",
    right: 0,
    top: "calc(100% + 8px)",
    width: 210,
    background: "var(--color-dropdown-bg)",
    border: `0.5px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"}`,
    borderRadius: 12,
    boxShadow: dark
      ? "0 8px 32px rgba(0,0,0,0.5)"
      : "0 8px 32px rgba(0,0,0,0.12)",
    padding: "6px 0",
    zIndex: 100,
    animation: "scaleIn .12s ease",
  };

  const dividerStyle = {
    height: "0.5px",
    background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    margin: "5px 0",
  };

  const mobileMenuStyle = {
    borderTop: `0.5px solid ${dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
    padding: "10px 12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(.96) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

      <header style={headerStyle}>
        <div style={innerStyle}>

          {/* ── Logo (centered on mobile, left on desktop) ── */}
          <Link
            to="/"
            style={{
              textDecoration: "none",
              flexShrink: 0,
              /* On mobile the logo sits naturally in flow; on md+ it's centered via margin auto trick */
            }}
          >
            <BrandLogo size="md" />
          </Link>

          {/* ── Desktop nav links (left of center) ── */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flex: 1,
              paddingLeft: 16,
            }}
            className="hide-mobile"
          >
            {navLinks.map((link) => (
              <NavLink key={link.to || link.href} to={link.to} href={link.href}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Right cluster ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>

            {/* Search */}
            <Link
              to="/campaigns"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 34,
                height: 34,
                borderRadius: 8,
                color: "var(--color-text-secondary)",
                textDecoration: "none",
                transition: "background .15s",
              }}
              aria-label="Search campaigns"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-background-secondary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              className="hide-mobile"
            >
              <FiSearch size={16} strokeWidth={2} />
            </Link>

            {/* Notification Bell (authenticated users only) */}
            {user && (
              <div className="hide-mobile">
                <NotificationBell />
              </div>
            )}

            {/* Theme toggle */}
            <IconBtn onClick={toggle} label="Toggle theme">
              {dark ? <FiSun size={16} strokeWidth={2} /> : <FiMoon size={16} strokeWidth={2} />}
            </IconBtn>

            {/* Authenticated user dropdown */}
            {user ? (
              <div style={{ position: "relative" }} ref={dropRef}>
                <button
                  onClick={() => setDropOpen((o) => !o)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px 4px 4px",
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--color-background-secondary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Avatar name={user.full_name} src={user.profile_picture} size={28} />
                  <FiChevronDown
                    size={14}
                    strokeWidth={2}
                    color="var(--color-text-tertiary)"
                    style={{
                      transition: "transform .2s",
                      transform: dropOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                {dropOpen && (
                  <div style={dropdownStyle}>
                    {/* User info */}
                    <div style={{ padding: "8px 14px 10px" }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          margin: 0,
                        }}
                      >
                        {user.full_name}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-tertiary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          margin: "2px 0 0",
                        }}
                      >
                        @{user.username}
                      </p>
                    </div>

                    <div style={dividerStyle} />

                    <DropItem to="/dashboard" icon={FiLayout} onClick={() => setDropOpen(false)}>
                      Dashboard
                    </DropItem>
                    <DropItem to="/campaigns/new" icon={FiPlus} onClick={() => setDropOpen(false)}>
                      New fundraiser
                    </DropItem>
                    <DropItem to={`/u/${user.username}`} icon={FiUser} onClick={() => setDropOpen(false)}>
                      My page
                    </DropItem>
                    <DropItem to="/financial" icon={FiDollarSign} onClick={() => setDropOpen(false)}>
                      Financial Center
                    </DropItem>
                    {user?.role === "admin" && (
                      <DropItem to="/admin" icon={FiDollarSign} onClick={() => setDropOpen(false)}>
                        Admin Center
                      </DropItem>
                    )}

                    <div style={dividerStyle} />

                    <button
                      onClick={() => { logout(); navigate("/"); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        margin: "0 4px",
                        width: "calc(100% - 8px)",
                        borderRadius: 7,
                        border: "none",
                        background: "transparent",
                        fontSize: 13.5,
                        fontFamily: "'DM Sans', sans-serif",
                        color: "#E53E3E",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background .12s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "rgba(229,62,62,.08)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <FiLogOut size={15} strokeWidth={1.75} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Guest auth buttons — desktop only */
              <div
                style={{ display: "flex", alignItems: "center", gap: 8 }}
                className="hide-mobile"
              >
                <Link
                  to="/login"
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "var(--color-text-primary)",
                    background: "var(--color-background-secondary)",
                    border: "0.5px solid var(--color-border-secondary)",
                    textDecoration: "none",
                    transition: "background .15s",
                  }}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#fff",
                    background: "#2BAAE1",
                    border: "none",
                    textDecoration: "none",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1A8FC2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#2BAAE1")}
                >
                  Get started
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <IconBtn
              onClick={() => setMobileOpen((o) => !o)}
              label="Menu"
            >
              <span className="show-mobile">
                {mobileOpen ? <FiX size={18} strokeWidth={2} /> : <FiMenu size={18} strokeWidth={2} />}
              </span>
            </IconBtn>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div style={mobileMenuStyle}>
            {navLinks.map((link) => (
              <MobileNavLink
                key={link.to || link.href}
                to={link.to}
                href={link.href}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </MobileNavLink>
            ))}

            {!user && (
              <div style={{ display: "flex", gap: 8, padding: "8px 2px 2px" }}>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "9px 0",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 500,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "var(--color-text-primary)",
                    background: "var(--color-background-secondary)",
                    border: "0.5px solid var(--color-border-secondary)",
                    textDecoration: "none",
                  }}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "9px 0",
                    borderRadius: 8,
                    fontSize: 13.5,
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#fff",
                    background: "#2BAAE1",
                    textDecoration: "none",
                  }}
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Responsive helpers — scoped so they don't leak */}
      <style>{`
        @media (min-width: 768px) {
          .hide-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
      `}</style>
    </>
  );
}
