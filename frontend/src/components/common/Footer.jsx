import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="bg-navy-950 dark:bg-black" style={{ background: "#0A1628" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <BrandLogo size="md" className="[&_span]:!text-white [&_span>span]:!text-gold-500" />
            </div>
            <p className="text-sm text-white/45 leading-relaxed max-w-xs">
              Built for Africa, by Africans. Fund together, rise together.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-gold-500 mb-5">
              Platform
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/campaigns/new", label: "Start a Campaign" },
                { to: "/campaigns", label: "Discover Campaigns" },
                { to: "/funding", label: "Crowdfunding" },
                { to: "/buy-coffee", label: "Get me a doll" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/55 hover:text-white/90 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-gold-500 mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/", label: "About Us" },
                { to: "/", label: "How It Works" },
                { to: "/", label: "Pricing & Fees" },
                { to: "/", label: "Blog" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/55 hover:text-white/90 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-gold-500 mb-5">
              Support
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/help", label: "Help Center" },
                { to: "/contact", label: "Contact Us" },
                { to: "/trust", label: "Trust & Safety" },
                { to: "/privacy", label: "Privacy Policy" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/55 hover:text-white/90 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/35">
            &copy; {new Date().getFullYear()} Promesapay. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <span className="text-xs text-white/35 cursor-pointer hover:text-gold-500 transition-colors">English</span>
            <span className="text-xs text-white/35 cursor-pointer hover:text-gold-500 transition-colors">Twi</span>
            <span className="text-xs text-white/35 cursor-pointer hover:text-gold-500 transition-colors">Hausa</span>
            <span className="text-xs text-white/35 cursor-pointer hover:text-gold-500 transition-colors">Ewe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}