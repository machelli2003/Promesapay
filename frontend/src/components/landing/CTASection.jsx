import { Link } from "react-router-dom";
import { ArrowRight, Coffee, Heart } from "lucide-react";
import AppButton from "../ui/AppButton";

export default function CTASection() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 md:p-12 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to start receiving support?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Join thousands of creators who are already building sustainable income with Promesapay.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="group">
                <AppButton
                  size="lg"
                  className="w-full sm:w-auto"
                  iconRight={ArrowRight}
                >
                  Create Your Page
                </AppButton>
              </Link>
              <Link to="/login">
                <AppButton
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  Sign In
                </AppButton>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>No hidden fees</span>
              </div>
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span>Instant payouts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}