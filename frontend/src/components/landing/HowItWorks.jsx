const steps = [
  {
    num: "01",
    icon: "✍️",
    title: "Create Your Page",
    desc: "Sign up, add your photo and bio. Set up in just a few minutes.",
  },
  {
    num: "02",
    icon: "🔗",
    title: "Share Your Link",
    desc: "Get your unique Promesapay link and share it everywhere online.",
  },
  {
    num: "03",
    icon: "💰",
    title: "Get Supported",
    desc: "Receive donations, tips, and recurring support from your community.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-b border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
            Get started in 3 steps
          </span>
          <h2 className="mb-4 mt-2 text-4xl font-bold text-slate-900 dark:text-slate-50">
            It's simple to get funded
          </h2>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Create your page, share your link, and start receiving support from your community today.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.num} className="relative min-h-[220px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-lg">
              {/* Connector line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-12 hidden h-px w-8 bg-slate-200 lg:block dark:bg-slate-800" />
              )}

              {/* Card */}
              <div className="space-y-4">
                {/* Number */}
                <div className="text-sm font-bold text-sky-600 dark:text-sky-400">
                  {step.num}
                </div>

                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/30 text-xl">
                  {step.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}