import { Link, useLocation, useNavigate } from "react-router-dom";
import { Coffee, Moon, Sun, LayoutDashboard, User,
         LogOut, ChevronDown, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useState, useRef, useEffect } from "react";
import Avatar from "../ui/Avatar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const fn = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg group-hover:shadow-violet-500/50">
              <Coffee className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-lg bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Promesapay</span>
          </Link>

          {/* Desktop nav links */}
          {!user && (
            <nav className="hidden md:flex items-center gap-1 flex-1 ml-4">
              <a href="#features"     className="btn-ghost btn-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">Features</a>
              <a href="#how-it-works" className="btn-ghost btn-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">How it works</a>
            </nav>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Theme */}
            <button onClick={toggle}
              className="btn-ghost btn-sm p-2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              aria-label="Toggle theme">
              {dark
                ? <Sun className="h-4 w-4" strokeWidth={2} />
                : <Moon className="h-4 w-4" strokeWidth={2} />
              }
            </button>

            {user ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropOpen(o => !o)}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Avatar name={user.full_name} src={user.profile_picture} size="sm" />
                  <span className="hidden sm:block text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[96px] truncate">
                    {user.full_name}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${dropOpen ? "rotate-180" : ""}`} />
                </button>

                {dropOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 card dark:bg-slate-800 shadow-lg py-1.5 animate-scale-in z-50">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.full_name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">@{user.username}</p>
                    </div>
                    <div className="divider my-1 dark:border-slate-700" />
                    {[
                      { to: "/dashboard",          icon: LayoutDashboard, label: "Dashboard" },
                      { to: `/u/${user.username}`, icon: User,            label: "My page" },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 rounded-md mx-1 transition-colors">
                        <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" strokeWidth={1.75} />
                        {label}
                      </Link>
                    ))}
                    <div className="divider my-1 dark:border-slate-700" />
                    <button onClick={() => { logout(); navigate("/"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md mx-1 transition-colors">
                      <LogOut className="h-4 w-4" strokeWidth={1.75} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"    className="btn-secondary btn-sm">Sign in</Link>
                <Link to="/register" className="btn-primary btn-sm">Get started</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(o => !o)}
              className="md:hidden btn-ghost btn-sm p-2">
              {mobileOpen
                ? <X className="h-4 w-4" />
                : <Menu className="h-4 w-4" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-0.5 animate-slide-down">
          {!user ? (
            <>
              <a href="#features"     className="block px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Features</a>
              <a href="#how-it-works" className="block px-3 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">How it works</a>
              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link to="/login"    className="btn-secondary btn-sm justify-center">Sign in</Link>
                <Link to="/register" className="btn-primary btn-sm justify-center">Get started</Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/dashboard"          className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><LayoutDashboard className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Dashboard</Link>
              <Link to={`/u/${user.username}`} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"><User className="h-4 w-4 text-slate-400 dark:text-slate-500" /> My page</Link>
              <button onClick={() => { logout(); navigate("/"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}