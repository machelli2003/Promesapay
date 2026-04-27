import React from 'react';
import { ArrowRight, Coffee, Heart, Users, TrendingUp, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative bg-white dark:bg-slate-950 pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-violet-100 dark:border-violet-800">
            <Coffee className="w-4 h-4" />
            Support creators you love
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Fund Your Dreams,
            <span className="text-violet-600 dark:text-violet-400"> One Coffee at a Time</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The simple way for creators to receive support from their community.
            Set up your page in minutes and start receiving donations and coffee tips.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Receiving Support
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/buy-coffee"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Coffee className="w-5 h-5 text-amber-600" />
              Buy a Coffee
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">50K+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Creators</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">GH₵2M+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Raised</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">100K+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Supporters</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">4.9★</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Rating</p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Coffee,
                title: "Buy Me a Coffee",
                description: "Quick GH₵5 coffee tips. Perfect for showing appreciation.",
                color: "amber"
              },
              {
                icon: Heart,
                title: "Donations",
                description: "Set funding goals and receive one-time donations.",
                color: "rose"
              },
              {
                icon: Users,
                title: "Build Community",
                description: "Connect with supporters who believe in your work.",
                color: "violet"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200 hover:shadow-lg"
              >
                <div className={`w-12 h-12 rounded-lg bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="mt-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
            Trusted by creators worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['Paystack', 'Stripe', 'Visa', 'Mastercard'].map((brand) => (
              <div key={brand} className="text-slate-400 dark:text-slate-600 font-semibold text-lg">
                {brand}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;