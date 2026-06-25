import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";
import AppButton from "../components/ui/AppButton";
import { useResponsive } from "../utils/responsiveUtils";

const dollTiers = [
  { cups: 1, price: "GH₵5", label: "A small doll", popular: false },
  { cups: 3, price: "GH₵15", label: "Doll set", popular: true },
  { cups: 5, price: "GH₵25", label: "Collector's bundle", popular: false },
];

export default function BuyDoll() {
  const { isMobile } = useResponsive();
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className={isMobile ? "px-4 py-4" : "max-w-6xl mx-auto px-6 py-4"}>
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <FiArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to home</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className={isMobile ? "px-4 py-8" : "max-w-6xl mx-auto px-6 py-16"}>
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium px-4 py-2 rounded-full mb-4 sm:mb-6">
            <span className="text-sm">🧸</span>
            Get me a doll
          </div>
          <h1 className={`${isMobile ? "text-2xl" : "text-4xl md:text-5xl"} font-bold text-slate-900 dark:text-white mb-4 sm:mb-6`}>
            Show your appreciation with a doll
          </h1>
          <p className={`${isMobile ? "text-base" : "text-xl"} text-slate-600 dark:text-slate-400`}>
            A simple way to support creators. Quick, secure, and makes their day better.
          </p>
        </div>

        {/* Doll Tiers */}
        <div className={`grid gap-4 sm:gap-6 max-w-5xl mx-auto mb-8 sm:mb-16 ${isMobile ? "grid-cols-1" : "md:grid-cols-3"}`}>
          {dollTiers.map((tier) => (
            <div
              key={tier.cups}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                tier.popular
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30 shadow-lg sm:scale-105"
                  : "border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-sky-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-xl">
                    <span className="text-2xl">🧸</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {tier.cups} {tier.cups === 1 ? 'Doll' : 'Dolls'}
                </h3>
                <p className="text-3xl font-bold text-sky-600 dark:text-sky-400 mb-2">
                  {tier.price}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {tier.label}
                </p>
                <Link to="/register">
                  <AppButton
                    className={`w-full py-3 px-4 sm:py-2 sm:px-3 ${tier.popular ? 'bg-sky-600 hover:bg-sky-700' : ''}`}
                    variant={tier.popular ? 'primary' : 'secondary'}
                  >
                    Get {tier.cups} Doll{tier.cups > 1 ? 's' : ''}
                  </AppButton>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="max-w-3xl mx-auto">
          <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-slate-900 dark:text-white text-center mb-8`}>
            How it works
          </h2>
          <div className="space-y-6">
            {[
              { icon: FiUsers, title: "Choose a creator", desc: "Find someone whose work you appreciate" },
              { icon: FiUsers, title: "Select doll amount", desc: "Pick how many dolls you'd like to get" },
              { icon: FiCheckCircle, title: "Make their day", desc: "They'll receive your support instantly" }
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-slate-50 dark:bg-slate-900 py-8 sm:py-12">
        <div className={isMobile ? "px-4" : "max-w-6xl mx-auto px-6"}>
          <div className={`grid gap-6 sm:gap-8 text-center ${isMobile ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-3"}`}>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">100K+</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Dolls bought</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">GH₵500K+</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Support given</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-1">50K+</p>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Happy creators</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
