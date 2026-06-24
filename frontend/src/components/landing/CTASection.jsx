import { Link } from "react-router-dom";
import { FiCheck } from "react-icons/fi";

export default function CTASection() {
  return (
    <section
      id="cta"
      className="relative py-24 px-4 sm:px-6 lg:px-8 bg-navy-700 overflow-hidden"
    >
      {/* Decorative gradient circle */}
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="max-w-xl">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
            Your community is ready.<br />Are you?
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            Join thousands of Ghanaians using the power of collective giving to change lives and build futures. No setup fees, ever.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <Link
            to="/register"
            className="inline-flex px-10 py-4 bg-gold-500 text-navy-950 font-bold text-base rounded-full hover:bg-gold-400 transition-all duration-200 hover:-translate-y-0.5"
          >
            Create Your Campaign Free →
          </Link>
          <span className="text-xs text-white/40">
            <FiCheck size={12} className="inline" /> Free to start &nbsp; <FiCheck size={12} className="inline" /> MoMo & Card accepted &nbsp; <FiCheck size={12} className="inline" /> Verified within 24hrs
          </span>
        </div>
      </div>
    </section>
  );
}