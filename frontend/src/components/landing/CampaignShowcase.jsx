import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { FaHeartbeat, FaShoppingBag, FaGraduationCap } from "react-icons/fa";

const campaigns = [
  {
    id: 1,
    thumbClass: "a",
    icon: FaHeartbeat,
    tag: "Medical Emergency",
    title: "Ama's Kidney Treatment — Accra",
    desc: "Ama is a 32-year-old teacher who needs urgent dialysis. Every cedi counts for her recovery.",
    raised: 22800,
    target: 30000,
    pct: 76,
  },
  {
    id: 2,
    thumbClass: "b",
    icon: FaShoppingBag,
    tag: "Business / Startup",
    title: "FarmDirect — Cocoa-to-Market App",
    desc: "Helping cocoa farmers sell directly to buyers, eliminating middlemen and increasing earnings by 40%.",
    raised: 55000,
    target: 100000,
    pct: 55,
  },
  {
    id: 3,
    thumbClass: "c",
    icon: FaGraduationCap,
    tag: "Education",
    title: "100 Laptops for Northern Region Students",
    desc: "Equipping underprivileged students in Tamale with the tools they need for digital literacy.",
    raised: 89000,
    target: 100000,
    pct: 89,
  },
];

const tabs = ["All", "Medical", "Education", "Business", "Agriculture"];

export default function CampaignShowcase() {
  const [activeTab, setActiveTab] = useState("All");

  return (
    <section id="campaigns" className="py-24 px-4 sm:px-6 lg:px-8 bg-cream dark:bg-navy-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
          <div>
            <div className="section-label">Active Campaigns</div>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-navy-700 dark:text-navy-50">
              What Ghana is<br />funding right now
            </h2>
          </div>
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-navy-950 font-semibold text-sm rounded-full hover:bg-gold-400 transition-all duration-200 whitespace-nowrap"
          >
            View All Campaigns <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="tabs-pill mb-10 max-w-full overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-pill ${activeTab === tab ? "active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Campaign Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const IconComponent = camp.icon;
            return (
              <Link
                key={camp.id}
                to={`/campaigns`}
                className="camp-card block"
              >
                <div
                  className={`camp-thumb ${camp.thumbClass}`}
                  style={{
                    background:
                      camp.thumbClass === "a"
                        ? "linear-gradient(135deg, #1E3A5F, #3B82F6)"
                        : camp.thumbClass === "b"
                        ? "linear-gradient(135deg, #7C2D12, #F97316)"
                        : "linear-gradient(135deg, #1E3A5F, #1D4ED8)",
                  }}
                >
                  <IconComponent className="text-4xl text-white/70" />
                </div>
                <div className="camp-body">
                  <div className="camp-tag">{camp.tag}</div>
                  <div className="camp-name">{camp.title}</div>
                  <div className="camp-desc">{camp.desc}</div>
                  <div className="progress-bar-wrap mb-3">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${camp.pct}%` }}
                    />
                  </div>
                  <div className="camp-footer">
                    <span className="camp-raised">
                      GH₵<strong>{camp.raised.toLocaleString()}</strong> of GH₵
                      {camp.target.toLocaleString()}
                    </span>
                    <span className="camp-pct">{camp.pct}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}