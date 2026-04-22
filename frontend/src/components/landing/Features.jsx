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
    icon: Heart,
    title: "Donation Goals",
    desc: "Set a funding target, track progress, and let supporters rally around your mission.",
    iconBg: "bg-rose-100 dark:bg-rose-900",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Coffee,
    title: "Coffee Tips",
    desc: "Quick GH₵5 tips in 1, 3, or 5 cup amounts — casual support made effortless.",
    iconBg: "bg-amber-100 dark:bg-amber-900",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: BarChart3,
    title: "Live Dashboard",
    desc: "Track every transaction, supporter, and milestone in real time.",
    iconBg: "bg-indigo-100 dark:bg-indigo-900",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: Share2,
    title: "Shareable Page",
    desc: "Your own link at fundme.app/u/you — drop it anywhere your audience finds you.",
    iconBg: "bg-purple-100 dark:bg-purple-900",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Shield,
    title: "Paystack Secured",
    desc: "Every payment handled by Africa's most trusted payment infrastructure.",
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Zap,
    title: "Quick Setup",
    desc: "Sign up, fill your profile, and start receiving support in minutes.",
    iconBg: "bg-orange-100 dark:bg-orange-900",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="border-b border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Features
          </span>
          <h2 className="mb-4 mt-2 text-4xl font-bold text-slate-900 dark:text-slate-50">
            Built for creators, by creators
          </h2>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Simple tools designed to get out of your way so you can focus on what you do best.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-800 dark:hover:border-slate-700"
            >
              <div
                className={`mb-4 inline-flex rounded-lg p-3 ${feature.iconBg}`}
              >
                <feature.icon
                  className={`h-6 w-6 ${feature.iconColor}`}
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                {feature.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}