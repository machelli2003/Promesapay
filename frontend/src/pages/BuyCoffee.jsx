import { Coffee, ArrowRight, CheckCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import AppButton from "../components/ui/AppButton";

const coffeeTiers = [
  { cups: 1, price: "GH₵5", label: "A quick coffee", popular: false },
  { cups: 3, price: "GH₵15", label: "Coffee break", popular: true },
  { cups: 5, price: "GH₵25", label: "Afternoon treat", popular: false },
];

export default function BuyCoffee() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to home</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Coffee className="h-4 w-4" />
            Buy Me a Coffee
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Show your appreciation with a coffee
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            A simple way to support creators. Quick, secure, and makes their day better.
          </p>
        </div>

        {/* Coffee Tiers */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {coffeeTiers.map((tier) => (
            <div
              key={tier.cups}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                tier.popular
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-lg scale-105"
                  : "border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-xl">
                    <Coffee className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {tier.cups} {tier.cups === 1 ? 'Cup' : 'Cups'}
                </h3>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-2">
                  {tier.price}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {tier.label}
                </p>
                <Link to="/register">
                  <AppButton
                    className={`w-full ${tier.popular ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                    variant={tier.popular ? 'primary' : 'secondary'}
                  >
                    Buy {tier.cups} Coffee{tier.cups > 1 ? 's' : ''}
                  </AppButton>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            How it works
          </h2>
          <div className="space-y-6">
            {[
              { icon: Coffee, title: "Choose a creator", desc: "Find someone whose work you appreciate" },
              { icon: Users, title: "Select coffee amount", desc: "Pick how many cups you'd like to buy" },
              { icon: CheckCircle, title: "Make their day", desc: "They'll receive your support instantly" }
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
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
      <div className="bg-slate-50 dark:bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">100K+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Coffees bought</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">GH₵500K+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Support given</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">50K+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Happy creators</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
