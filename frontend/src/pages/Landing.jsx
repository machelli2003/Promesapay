import { Link } from "react-router-dom";
import { Coffee, Heart } from "lucide-react";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import CTASection from "../components/landing/CTASection";
import AppButton from "../components/ui/AppButton";

export default function Landing() {
  return (
    <div className="animate-fade-in">
      <Hero />
      
      {/* Quick Navigation Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Choose Your Path
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Buy Me a Coffee Card */}
            <Link to="/buy-coffee" className="group">
              <div className="card p-8 h-full hover:shadow-xl transition-shadow bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-300">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-amber-200 text-amber-700 mb-4 group-hover:transform group-hover:scale-110 transition-transform">
                  <Coffee className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Buy Me a Coffee
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Let supporters show appreciation with quick, simple coffee tips. Perfect for creators who want instant micro-donations.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span> Quick payments
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span> Multiple tiers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-500">✓</span> Instant support
                  </li>
                </ul>
                <AppButton variant="secondary" className="w-full bg-amber-600 hover:bg-amber-700 text-white border-0">
                  Explore Coffee Tips →
                </AppButton>
              </div>
            </Link>

            {/* Funding Campaign Card */}
            <Link to="/funding" className="group">
              <div className="card p-8 h-full hover:shadow-xl transition-shadow bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 hover:border-rose-300">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-rose-200 text-rose-700 mb-4 group-hover:transform group-hover:scale-110 transition-transform">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Project Funding
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Set ambitious funding goals and let your community support your dreams. Track progress and celebrate milestones together.
                </p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-rose-500">✓</span> Custom goals
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-500">✓</span> Progress tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-rose-500">✓</span> Community support
                  </li>
                </ul>
                <AppButton variant="secondary" className="w-full bg-rose-600 hover:bg-rose-700 text-white border-0">
                  Start Campaign →
                </AppButton>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <Features />
      <HowItWorks />
      <CTASection />
    </div>
  );
}