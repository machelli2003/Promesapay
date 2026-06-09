import { Link } from "react-router-dom";
import { FiHeart, FiGithub, FiTwitter } from "react-icons/fi";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <BrandLogo size="md" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md">
              Empowering African creators to turn their passion into sustainable income. Join thousands of creators receiving support from their communities.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors">
                <FiTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-900/50 transition-colors">
                <FiGithub className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { to: "/campaigns", label: "Browse fundraisers" },
                { to: "/campaigns/new", label: "Start a fundraiser" },
                { to: "/buy-coffee", label: "Buy a coffee" },
                { to: "/#features", label: "Features" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Support</h4>
            <ul className="space-y-2">
              {[
                { to: "/help", label: "Help Center" },
                { to: "/contact", label: "Contact Us" },
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms of Service" }
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
            <span>© {new Date().getFullYear()}</span>
            <BrandLogo to="/" size="xs" asLink />
            <span className="flex items-center gap-1">
              · Made with <FiHeart className="h-4 w-4 text-red-500 fill-current" /> for African creators
            </span>
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Terms
            </a>
            <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}