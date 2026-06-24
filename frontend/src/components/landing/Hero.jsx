import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { FaSeedling, FaBookOpen, FaPills } from "react-icons/fa";
import { BsStars } from "react-icons/bs";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-cream dark:bg-navy-950"
    >
      {/* Kente pattern background */}
      <div
        className="absolute right-[-80px] top-[-80px] w-[650px] h-[650px] opacity-[0.06] rounded-full"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, #F97316 0, #F97316 2px, transparent 2px, transparent 20px),
            repeating-linear-gradient(-45deg, #1E3A5F 0, #1E3A5F 2px, transparent 2px, transparent 20px),
            repeating-linear-gradient(90deg, #3B82F6 0, #3B82F6 2px, transparent 2px, transparent 40px)
          `,
          animation: "spin 60s linear infinite",
        }}
      />

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Content */}
          <div className="hero-content">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold tracking-wider uppercase text-gold-500">
                Built for Ghana & Africa
              </span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-navy-700 dark:text-navy-50 mb-6">
            
              <span className="relative inline-block">
                <span className="relative z-10">Support</span>
                <span
                  className="absolute bottom-2 left-0 right-0 h-3 bg-gold-500/30 rounded-sm -skew-x-2"
                />
              </span>{" "}
              Creators.{" "}
              <em className="not-italic text-gold-500 text-5xl">Pay it forward.</em>
            </h1>

            {/* Subtitle */}
           
            <p className="text-base sm:text-lg text-muted leading-relaxed max-w-lg mb-8">
             or set up your Creator Dash and let your fans, followers, and customers support your work directly. All payments via MTN MoMo, Vodafone Cash & AirtelTigo Money.
            </p>

            

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-navy-700 text-gold-500 font-semibold text-base rounded-full hover:bg-navy-600 transition-all duration-200 hover:-translate-y-0.5 shadow-glow"
              >
                 Start a Campaign
                <FiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-navy-700 dark:text-navy-200 font-medium text-base rounded-full border-2 border-navy-700/20 dark:border-navy-300/30 hover:border-navy-700 transition-all duration-200"
              >
                Set Up Creator Dash
              </Link>
            </div>

            {/* Stats */}
            <div className="flex  gap-20 mt-12 pt-8 border-t border-gold-500/20">
              <div className="flex flex-col gap-1">
                <span className="font-heading text-2xl font-extrabold text-navy-700 dark:text-navy-50 tracking-tight">
                  GH₵4.2M+
                </span>
                <span className="text-xs text-muted">Total Raised</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-heading text-2xl font-extrabold text-navy-700 dark:text-navy-50 tracking-tight">
                  1,800+
                </span>
                <span className="text-xs text-muted">Campaigns Funded</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-heading text-2xl font-extrabold text-navy-700 dark:text-navy-50 tracking-tight">
                  42K+
                </span>
                <span className="text-xs text-muted">Contributors</span>
              </div>
            </div>
          </div>

          {/* Right — Campaign Card Stack */}
          <div className="relative h-[500px] hidden lg:flex items-center justify-center">
            {/* Card 1 */}
            <div className="campaign-card card-1">
              <div className="card-img" style={{ background: "linear-gradient(135deg, #1D4ED8, #3B82F6)" }}>
                <FaSeedling className="text-4xl text-white/80" />
              </div>
              <span className="camp-tag block">Agriculture</span>
              <div className="card-title">Modern Irrigation for Brong-Ahafo Farmers</div>
              <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: "68%" }}></div></div>
              <div className="card-meta"><span className="card-amount">GH₵34,000 raised</span><span>68%</span></div>
            </div>

            {/* Card 2 */}
            <div className="campaign-card card-2">
              <div className="card-img" style={{ background: "linear-gradient(135deg, #7C2D12, #F97316)" }}>
                <FaBookOpen className="text-4xl text-white/80" />
              </div>
              <span className="camp-tag block">Education</span>
              <div className="card-title">Scholarships for Volta Region Girls</div>
              <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: "82%" }}></div></div>
              <div className="card-meta"><span className="card-amount">GH₵41,000 raised</span><span>82%</span></div>
            </div>

            {/* Card 3 */}
            <div className="campaign-card card-3">
              <div className="card-img" style={{ background: "linear-gradient(135deg, #1E3A5F, #1D4ED8)" }}>
                <FaPills className="text-4xl text-white/80" />
              </div>
              <span className="camp-tag block">Medical</span>
              <div className="card-title">Kofi's Heart Surgery Fund — Kumasi</div>
              <div className="progress-bar-wrap"><div className="progress-bar-fill" style={{ width: "94%" }}></div></div>
              <div className="card-meta"><span className="card-amount">GH₵18,800 raised</span><span>94%</span></div>
            </div>

            {/* Floating badge */}
            <div className="floating-badge z-10" style={{ position: "absolute", bottom: "60px", left: "-30px" }}>
              <BsStars className="inline-block mr-1" /> <strong>GH₵1,200</strong> raised in the last hour
            </div>
          </div>
        </div>
      </div>

      {/* Card stack styles (scoped) */}
      <style>{`
        .campaign-card {
          position: absolute;
          background: #ffffff;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(30,58,95,0.1);
          width: 320px;
          transition: transform 0.3s;
        }
        .dark .campaign-card {
          background: #162d4a;
        }
        .card-1 {
          transform: rotate(-5deg) translateX(-30px) translateY(20px);
          z-index: 1;
        }
        .card-2 {
          transform: rotate(2deg) translateX(20px);
          z-index: 2;
        }
        .card-3 {
          transform: rotate(-1deg) translateY(-10px);
          z-index: 3;
        }
        .card-3:hover {
          transform: rotate(0deg) translateY(-14px);
          box-shadow: 0 30px 80px rgba(30,58,95,0.18);
        }
        .card-img {
          width: 100%;
          height: 140px;
          border-radius: 12px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card-tag {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #F97316;
          background: rgba(249,115,22,0.1);
          border-radius: 50px;
          padding: 3px 10px;
          display: inline-block;
          margin-bottom: 10px;
        }
        .card-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: #0A1628;
          margin-bottom: 12px;
          line-height: 1.3;
        }
        .dark .card-title {
          color: #f8fafc;
        }
        .progress-bar-wrap {
          background: #EEF2FF;
          border-radius: 50px;
          height: 6px;
          margin-bottom: 10px;
        }
        .dark .progress-bar-wrap {
          background: #1e293b;
        }
        .progress-bar-fill {
          height: 100%;
          border-radius: 50px;
          background: linear-gradient(90deg, #1D4ED8, #F97316);
        }
        .card-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: #6B7A99;
        }
        .card-amount {
          font-weight: 600;
          color: #1E3A5F;
        }
        .dark .card-amount {
          color: #f8fafc;
        }
        .floating-badge {
          background: #1E3A5F;
          color: #fff;
          border-radius: 14px;
          padding: 12px 18px;
          font-size: 0.8rem;
          font-weight: 500;
          box-shadow: 0 10px 30px rgba(30,58,95,0.3);
          animation: float 4s ease-in-out infinite;
          white-space: nowrap;
        }
        .floating-badge strong {
          color: #F97316;
          font-weight: 700;
        }
        .hero-content > * {
          animation: fadeIn 0.7s ease both;
        }
        .hero-content > *:nth-child(1) { animation-delay: 0.1s; }
        .hero-content > *:nth-child(2) { animation-delay: 0.25s; }
        .hero-content > *:nth-child(3) { animation-delay: 0.4s; }
        .hero-content > *:nth-child(4) { animation-delay: 0.55s; }
        .hero-content > *:nth-child(5) { animation-delay: 0.7s; }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}