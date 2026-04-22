import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AppButton from "../ui/AppButton";

export default function CTASection() {
  return (
    <section className="bg-slate-50 py-20 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 px-8 py-16 sm:px-12 sm:py-20">
          {/* Decorative gradient blur */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          {/* Content */}
          <div className="relative z-10 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
              Ready to receive support?
            </h2>
            <p className="mb-10 text-lg text-indigo-100">
              Join thousands of creators across Africa turning their passion into income with FundMe.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register">
                <AppButton
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-slate-50"
                  iconRight={ArrowRight}
                >
                  Create your page
                </AppButton>
              </Link>
              <Link
                to="/login"
                className="text-indigo-100 transition-colors hover:text-white"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}