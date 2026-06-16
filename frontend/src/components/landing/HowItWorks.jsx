import React from "react";
import { FaBullseye, FaBullhorn, FaMoneyBillWave } from "react-icons/fa";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      icon: FaBullseye,
      title: "Set Your Goal",
      text: "Choose between a crowdfunding campaign (equity/rewards) or a personal fundraising drive. Set your target, deadline, and story.",
    },
    {
      num: "02",
      icon: FaBullhorn,
      title: "Share Widely",
      text: "Share your campaign link on WhatsApp, Facebook, or anywhere. Our tools help you reach beyond your inner circle.",
    },
    {
      num: "03",
      icon: FaMoneyBillWave,
      title: "Receive Funds",
      text: "Receive donations via Mobile Money (MTN, Vodafone, AirtelTigo), bank transfer, or card. Withdraw anytime.",
    },
  ];

  return (
    <section id="how" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-navy-700 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-2">
          <span className="section-label !text-gold-400">Simple Process</span>
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
          From idea to funded<br />in three steps
        </h2>
        <p className="text-white/60 max-w-lg text-base leading-relaxed">
          No complicated forms, no long waits. Create your campaign, share your story, and watch your community rally around you.
        </p>

        <div className="grid md:grid-cols-3 gap-0 mt-14">
          {steps.map((step, i) => {
            const IconComponent = step.icon;
            return (
              <div
                key={step.num}
                className={`relative px-8 py-10 ${i < steps.length - 1 ? "border-r border-gold-500/15" : ""}`}
              >
                <div className="font-heading text-6xl font-extrabold text-gold-500/15 leading-none mb-5">
                  {step.num}
                </div>
                <span className="text-3xl block mb-4 text-gold-400">
                  <IconComponent className="text-4xl" />
                </span>
                <h3 className="font-heading text-lg font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}