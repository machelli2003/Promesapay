import React from 'react';
import { FiArrowRight, FiCoffee, FiHeart, FiUsers, FiTrendingUp, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative bg-white dark:bg-slate-950 pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-600 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-sky-100 dark:border-sky-800">
            <FiCoffee className="w-4 h-4" />
            Support creators you love
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
            Where creators get
            <span className="text-sky-600 dark:text-sky-400"> supported</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Get started in minutes. Build trust with your community. Receive support you deserve.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Receiving Support
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/campaigns"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-200 hover:-translate-y-0.5"
            >
              <FiHeart className="w-5 h-5 text-rose-500" />
              Browse fundraisers
            </Link>
          </div>

          {/* Trust Stats */}
          <div className="mb-20 p-8 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-2xl border border-sky-100 dark:border-sky-800">
            <p className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white mb-8">
              <span className="text-sky-600 dark:text-sky-400 text-2xl md:text-3xl font-bold">GH₵2M+</span> raised every month
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">50K+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Creators</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">100K+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Supporters</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">30M+</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Coffees Bought</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">4.9★</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Trusted</p>
              </div>
            </div>
          </div>

          {/* Why Promesapay Cards */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">Why creators love Promesapay</h2>
            <p className="text-slate-600 dark:text-slate-400">Everything you need to get supported</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FiCoffee,
                title: "Easy to Get Started",
                description: "Create your page in minutes. No setup fees, no complexity.",
                color: "amber"
              },
              {
                icon: FiHeart,
                title: "Multiple Ways to Support",
                description: "Accept coffee tips, donations, or recurring support from your community.",
                color: "rose"
              },
              {
                icon: FiShield,
                title: "Secure & Trusted",
                description: "All payments secured by Paystack. Your earnings are always safe.",
                color: "blue"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-all duration-200 hover:shadow-lg"
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