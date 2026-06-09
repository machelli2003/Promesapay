import { Link } from "react-router-dom";
import { FiArrowRight, FiHeart } from "react-icons/fi";

const ORBIT_IMAGES = [
  {
    src: "/circle.jpg",
    alt: "Community coming together",
    className: "orbit-image orbit-image--top",
    delay: "0s",
  },
  {
    src: "/oval.jpg",
    alt: "Creator supported by their community",
    className: "orbit-image orbit-image--left",
    delay: "0.4s",
  },
  {
    src: "/path.jpg",
    alt: "Families and supporters united",
    className: "orbit-image orbit-image--right",
    delay: "0.8s",
  },
];

export default function CircularShowcase() {
  return (
    <section className="circular-showcase relative bg-white dark:bg-slate-950 py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,520px)] h-[min(90vw,520px)] rounded-full border border-sky-100 dark:border-sky-900/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(75vw,420px)] h-[min(75vw,420px)] rounded-full border border-dashed border-sky-200/80 dark:border-sky-800/60" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
        <div className="circular-showcase__stage relative mx-auto w-full max-w-[520px] aspect-square sm:max-w-[560px]">
          {/* Decorative curved arc */}
          <svg
            className="circular-showcase__arc absolute inset-0 w-full h-full text-sky-300 dark:text-sky-700 pointer-events-none"
            viewBox="0 0 400 400"
            fill="none"
            aria-hidden
          >
            <path
              d="M 72 280 Q 200 60 328 280"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="8 10"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>

          {/* Orbit photos */}
          {ORBIT_IMAGES.map((img) => (
            <div
              key={img.src}
              className={`${img.className} circular-showcase__photo`}
              style={{ animationDelay: img.delay }}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}

          {/* Center content */}
          <div className="circular-showcase__center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[min(85%,280px)] text-center px-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 mb-3">
              <FiHeart className="h-3.5 w-3.5" />
              Real stories. Real support.
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug mb-3">
              Fundraising built around{" "}
              <span className="text-sky-600 dark:text-sky-400">people</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
              Start a fundraiser, share your story, and let your community rally
              behind you — just like the world&apos;s top crowdfunding platforms.
            </p>
            <Link
              to="/campaigns"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              Explore fundraisers
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
