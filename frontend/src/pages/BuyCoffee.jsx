import { Coffee, Heart, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import AppButton from "../components/ui/AppButton";

export default function BuyCoffee() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Back Button */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <Link to="/">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side */}
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium px-3 py-1 rounded-full mb-6">
              <Coffee className="h-3.5 w-3.5" />
              Buy Me a Coffee
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Support with a Coffee
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Show your appreciation with a quick coffee tip. It's a simple, direct way to support creators you love.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Quick and easy payment",
                "Secure transactions via Paystack",
                "Support creators instantly",
                "Perfect for any occasion"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Coffee className="h-3 w-3 text-amber-700" />
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Link to="/register">
                <AppButton size="lg">
                  Get Started
                </AppButton>
              </Link>
              <Link to="/u/demo">
                <AppButton variant="secondary" size="lg">
                  See Example
                </AppButton>
              </Link>
            </div>
          </div>

          {/* Right side - Visual */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { amount: "GH₵5", label: "Espresso" },
              { amount: "GH₵10", label: "Latte" },
              { amount: "GH₵25", label: "Cold Brew" },
              { amount: "GH₵50", label: "Premium Blend" }
            ].map((tier) => (
              <div key={tier.label} className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <Coffee className="h-8 w-8 text-amber-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-gray-900 mb-1">{tier.amount}</p>
                <p className="text-sm text-gray-600">{tier.label}</p>
                <button className="btn btn-sm btn-primary justify-center w-full mt-3">
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mt-16 pt-16 border-t border-amber-200">
          {[
            { emoji: "☕", value: "50,000+", label: "Coffees Bought" },
            { emoji: "👥", value: "10,000+", label: "Support Creators" },
            { emoji: "🌍", value: "Across Africa", label: "Available Now" }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl mb-2">{stat.emoji}</div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
