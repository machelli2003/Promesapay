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
  FiShield,
} from "react-icons/fi";
import CediSign from "./CediSign";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useState, useRef, useEffect } from "react";
import BrandLogo from "./BrandLogo";
import NotificationBell from "./NotificationBell";

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

  /* Scroll detection for glass effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => location.pathname.startsWith(path);

  const adminNavLinks = [
    { to: "/admin", label: "Admin Home" },
    { to: "/admin/finance", label: "Finance" },
    { to: "/admin/payouts", label: "Payouts" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/disputes", label: "Disputes" },
    { to: "/admin/monitoring", label: "Monitoring" },
  ];

  const userNavLinks = [
    { to: "/campaigns", label: "Discover" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/wallet", label: "Wallet" },
    { to: "/campaigns/new", label: "Start Campaign" },
  ];

  const guestNavLinks = [
    { to: "/campaigns", label: "Discover" },
    { to: "/", label: "How It Works", hash: "#how" },
    { to: "/", label: "About", hash: "#trust" },
  ];

  const navLinks = user
    ? user.role === "admin"
      ? adminNavLinks
      : userNavLinks
    : guestNavLinks;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/88 dark:bg-navy-950/88 backdrop-blur-xl shadow-nav dark:shadow-nav-dark border-b border-transparent"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <BrandLogo size="md" />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) =>
                link.hash ? (
                  <a
                    key={link.label}
                    href={link.hash}
                    className="px-3 py-2 text-sm font-medium text-muted hover:text-navy-700 dark:hover:text-navy-200 rounded-lg hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors font-body"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-body ${
                      isActive(link.to)
                        ? "text-gold-500 bg-gold-50 dark:bg-gold-900/20"
                        : "text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800/50"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <Link
                to="/campaigns"
                className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors"
                aria-label="Search campaigns"
              >
                <FiSearch className="w-4 h-4" />
              </Link>

              {/* Notification Bell (authenticated) */}
              {user && (
                <div className="hidden md:block">
                  <NotificationBell />
                </div>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggle}
                aria-label="Toggle theme"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors"
              >
                {dark ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
              </button>

              {/* Authenticated User Dropdown */}
              {user ? (
                <div className="relative hidden md:block" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen((o) => !o)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-navy-700 dark:bg-navy-600 flex items-center justify-center text-gold-500 font-bold text-xs font-heading">
                      {(user.full_name || user.username || "U")
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <FiChevronDown
                      className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
                        dropOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {dropOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-navy-800 rounded-2xl shadow-xl border border-slate-200 dark:border-navy-700 py-2 animate-scale-in">
                      {/* User info */}
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-navy-700">
                        <p className="text-sm font-semibold text-navy-900 dark:text-navy-50 truncate">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-xs text-muted truncate">@{user.username}</p>
                      </div>

                      <div className="pt-1">
                        {user.role === "admin" ? (
                          <>
                            <Link
                              to="/admin"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <FiShield className="w-4 h-4" />
                              Admin Home
                            </Link>
                            <Link
                              to="/admin/finance"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <CediSign className="w-4 h-4" />
                              Finance Dashboard
                            </Link>
                            <Link
                              to="/admin/payouts"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <FiLayout className="w-4 h-4" />
                              Payout Queue
                            </Link>
                            <Link
                              to="/admin/users"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <FiUser className="w-4 h-4" />
                              User Management
                            </Link>
                            <Link
                              to="/admin/disputes"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <FiShield className="w-4 h-4" />
                              Dispute Resolution
                            </Link>
                            <Link
                              to="/admin/monitoring"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <FiSearch className="w-4 h-4" />
                              System Monitoring
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/dashboard"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <FiLayout className="w-4 h-4" />
                              Dashboard
                            </Link>
                            <Link
                              to="/campaigns/new"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <FiPlus className="w-4 h-4" />
                              New Campaign
                            </Link>
                            <Link
                              to={`/u/${user.username}`}
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <FiUser className="w-4 h-4" />
                              My Profile
                            </Link>
                            <Link
                              to="/financial"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <CediSign className="w-4 h-4" />
                              Financial Center
                            </Link>
                            <Link
                              to="/wallet"
                              onClick={() => setDropOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                            >
                              <CediSign className="w-4 h-4" />
                              Wallet & Withdrawals
                            </Link>
                            {user?.role === "admin" && (
                              <Link
                                to="/admin"
                                onClick={() => setDropOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted hover:text-navy-900 dark:hover:text-navy-50 hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors"
                              >
                                <FiShield className="w-4 h-4" />
                                Admin Center
                              </Link>
                            )}
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-100 dark:border-navy-700 pt-1 mt-1">
                        <button
                          onClick={() => {
                            logout();
                            navigate("/");
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <FiLogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Guest buttons */
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="btn-ghost text-sm px-4 py-2"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 bg-gold-500 text-navy-950 font-semibold text-sm rounded-full hover:bg-gold-400 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Menu"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors"
              >
                {mobileOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-xl animate-slide-down">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) =>
                link.hash ? (
                  <a
                    key={link.label}
                    href={link.hash}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                      isActive(link.to)
                        ? "text-gold-500 bg-gold-50 dark:bg-gold-900/20"
                        : "text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800"
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}

              {/* Divider */}
              <div className="border-t border-slate-100 dark:border-navy-700 my-2" />

              {user ? (
                user.role === "admin" ? (
                  <>
                    <div className="px-4 py-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy-700 dark:bg-navy-600 flex items-center justify-center text-gold-500 font-bold text-sm font-heading">
                        {(user.full_name || user.username || "U")
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-900 dark:text-navy-50">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-xs text-muted">@{user.username}</p>
                      </div>
                    </div>
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                      <FiShield className="w-4 h-4" />
                      Admin Home
                    </Link>
                    <Link
                      to="/admin/finance"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                              <CediSign className="w-4 h-4" />
                      Finance
                    </Link>
                    <Link
                      to="/admin/payouts"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                      <FiLayout className="w-4 h-4" />
                      Payouts
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                      <FiUser className="w-4 h-4" />
                      Users
                    </Link>
                    <Link
                      to="/admin/disputes"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                      <FiShield className="w-4 h-4" />
                      Disputes
                    </Link>
                    <Link
                      to="/admin/monitoring"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                      <FiSearch className="w-4 h-4" />
                      Monitoring
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-navy-700 dark:bg-navy-600 flex items-center justify-center text-gold-500 font-bold text-sm font-heading">
                        {(user.full_name || user.username || "U")
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-900 dark:text-navy-50">
                          {user.full_name || user.username}
                        </p>
                        <p className="text-xs text-muted">@{user.username}</p>
                      </div>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                      <FiLayout className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/financial"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:text-navy-700 dark:hover:text-navy-200 hover:bg-navy-50 dark:hover:bg-navy-800 rounded-xl transition-colors"
                    >
                      <CediSign className="w-4 h-4" />
                      Financial Center
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                )
              ) : (
                <div className="flex gap-3 px-4 pt-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-navy-700 dark:text-navy-200 border-2 border-navy-700/20 dark:border-navy-300/30 rounded-full hover:border-navy-700 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 text-sm font-semibold text-navy-950 bg-gold-500 rounded-full hover:bg-gold-400 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </header>

      {/* Spacer for fixed navbar */}
      <div className="h-16 md:h-18" />
    </>
  );
}