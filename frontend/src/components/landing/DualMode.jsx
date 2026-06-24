import { Link } from "react-router-dom";
import { FiCheck } from "react-icons/fi";

export default function DualMode() {
  return (
    <section id="modes" className="grid md:grid-cols-2">
      {/* Mode 1: Crowdfunding */}
      <div className="relative px-8 sm:px-12 lg:px-16 py-20 bg-navy-700 border-r border-gold-500/15 overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-6 h-[2px] bg-gold-500" />
            <span className="text-xs font-bold tracking-widest uppercase text-gold-500">Mode 1</span>
          </div>
          <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Crowdfund<br />your startup
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-md">
            Raise capital from your community and beyond. Offer rewards, equity, or just gratitude — you set the terms.
          </p>
          <ul className="space-y-3 mb-10">
            {[
              "Equity & rewards-based tiers",
              "Investor dashboard with updates",
              "Campaign analytics & insights",
              "Featured placements for visibility",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                <span className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <FiCheck size={10} className="text-gold-500" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <Link
            to="/funding"
            className="inline-flex px-8 py-3.5 border-2 border-gold-500 text-gold-500 font-semibold text-sm rounded-full hover:bg-gold-500 hover:text-navy-950 transition-all duration-200"
          >
            Start Crowdfunding →
          </Link>
        </div>
      </div>

      {/* Mode 2: Personal Fundraising */}
      <div className="relative px-8 sm:px-12 lg:px-16 py-20 bg-navy-950 overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-6 h-[2px] bg-gold-500" />
            <span className="text-xs font-bold tracking-widest uppercase text-gold-500">Mode 2</span>
          </div>
          <h3 className="font-heading text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-5">
            Personal<br />fundraising
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-md">
            Medical bills, school fees, funeral expenses, or rebuilding after disaster — your community has your back, fast.
          </p>
          <ul className="space-y-3 mb-10">
            {[
              "Launch in under 5 minutes",
              "Mobile Money withdrawals",
              "WhatsApp share integration",
              "Verified urgent campaign badge",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-white/70">
                <span className="w-5 h-5 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <FiCheck size={10} className="text-gold-500" />
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <Link
            to="/register"
            className="inline-flex px-8 py-3.5 border-2 border-gold-500 text-gold-500 font-semibold text-sm rounded-full hover:bg-gold-500 hover:text-navy-950 transition-all duration-200"
          >
            Start Fundraising →
          </Link>
        </div>
      </div>
    </section>
  );
}