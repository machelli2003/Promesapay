import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-16 md:pt-32 md:pb-24">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Funding Made Simple
              </span>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight">
              Bring Your Ideas to{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Life
              </span>
            </h1>
          </motion.div>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Connect with supporters who believe in your vision. Raise funds for
            your startup, creative project, or community initiative with ease.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105">
              Start a Campaign
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-all duration-200">
              Learn More
            </button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            variants={itemVariants}
            className="pt-8 border-t border-slate-200"
          >
            <p className="text-sm text-slate-600 mb-4">Trusted by creators</p>
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">2.5K+</p>
                <p className="text-xs text-slate-600">Active Campaigns</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">$4.2M</p>
                <p className="text-xs text-slate-600">Funded</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">18K+</p>
                <p className="text-xs text-slate-600">Supporters</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;