const steps = [
  {
    num: "01",
    icon: "✍️",
    title: "Create Account",
    desc: "Sign up with your email and pick a unique username for your profile.",
  },
  {
    num: "02",
    icon: "🎨",
    title: "Build Your Page",
    desc: "Add photo, bio, social links, and set a funding goal.",
  },
  {
    num: "03",
    icon: "🔗",
    title: "Share Your Link",
    desc: "Paste your link in your bio, email, or anywhere online.",
  },
  {
    num: "04",
    icon: "💰",
    title: "Get Supported",
    desc: "Receive donations and coffee tips directly to your account.",
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
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            How it works
          </span>
          <h2 className="mb-4 mt-2 text-4xl font-bold text-slate-900 dark:text-slate-50">
            Four steps to funded
          </h2>
          <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            No code, no complexity. Just a clean page your supporters will love.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.num} className="relative">
              {/* Connector line (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-8 hidden h-px w-8 bg-slate-200 lg:block dark:bg-slate-800" />
              )}

              {/* Card */}
              <div className="space-y-4">
                {/* Number */}
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {step.num}
                </div>

                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl dark:bg-slate-800">
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