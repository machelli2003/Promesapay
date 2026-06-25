import {
  FiHeart,
  FiBarChart2,
  FiShare2,
  FiShield,
  FiZap,
} from "react-icons/fi";

const features = [
  {
    icon: FiZap,
    title: "Instant Setup",
    desc: "Create your account and start receiving support in minutes. No technical skills required.",
  },
  {
    icon: FiShare2,
    title: "Easy to Share",
    desc: "Get a shareable link to post on your bio, emails, and social media.",
  },
  {
    icon: FiHeart,
    title: "Flexible Support",
    desc: "Accept donations, doll tips, or set up recurring support from your community.",
  },
  {
    icon: FiBarChart2,
    title: "Track Your Growth",
    desc: "Beautiful analytics dashboard to monitor earnings, supporters, and trends.",
  },
  {
    icon: FiShield,
    title: "Secure & Trusted",
    desc: "Bank-level security with Paystack. Instant payouts to your account.",
  },
  {
    icon: (props) => <span {...props}>🧸</span>,
    title: "Community Powered",
    desc: "Build genuine relationships with supporters who love your work.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Powerful features, zero friction
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to build and grow your creator business on Promesapay.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
            >
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}