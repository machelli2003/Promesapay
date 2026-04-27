import {
  Heart,
  Coffee,
  BarChart3,
  Share2,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Coffee,
    title: "Coffee Tips",
    desc: "Receive quick GH₵5 coffee tips from supporters. Perfect for casual support.",
  },
  {
    icon: Heart,
    title: "Donations",
    desc: "Set funding goals and receive one-time donations for your projects.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track your earnings, supporters, and growth in real-time.",
  },
  {
    icon: Share2,
    title: "Shareable Profile",
    desc: "Get a custom link to share with your audience anywhere.",
  },
  {
    icon: Shield,
    title: "Secure Payments",
    desc: "All payments processed securely through Paystack.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    desc: "Create your account and start receiving support in minutes.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything you need to receive support
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Simple, powerful tools designed for creators
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
            >
              <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
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