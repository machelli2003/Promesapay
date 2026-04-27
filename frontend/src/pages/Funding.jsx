import { Heart, ArrowRight, CheckCircle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import AppButton from "../components/ui/AppButton";

const campaigns = [
  {
    creator: "Ama Boateng",
    title: "Community Art Studio",
    goal: "GH₵5,000",
    raised: "GH₵3,200",
    percent: 64,
    image: "🎨"
  },
  {
    creator: "Kwame Opoku",
    title: "Tech Startup Fund",
    goal: "GH₵10,000",
    raised: "GH₵7,850",
    percent: 78,
    image: "💻"
  },
  {
    creator: "Nana Yaa",
    title: "Music Album Production",
    goal: "GH₵2,000",
    raised: "GH₵2,000",
    percent: 100,
    image: "🎵"
  }
];

export default function Funding() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Back to home</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Heart className="h-4 w-4" />
            Project Funding
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Fund your big dreams
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Set a funding goal and let your community help you achieve it. Creative projects, business ventures, personal goals—get backed by people who believe in you.
          </p>
        </div>

        {/* Campaign Examples */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {campaigns.map((campaign) => (
            <div
              key={campaign.creator}
              className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{campaign.image}</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      {campaign.creator}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {campaign.title}
                    </p>
                  </div>
                </div>
                {campaign.percent === 100 && (
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                    Funded
                  </span>
                )}
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">{campaign.raised} raised</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{campaign.percent}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      campaign.percent === 100 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${campaign.percent}%` }}
                  />
                </div>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Goal: {campaign.goal}
              </p>

              <Link to="/register">
                <button className="w-full btn btn-sm btn-primary flex items-center justify-center gap-2">
                  <Heart className="h-3.5 w-3.5" />
                  Support Campaign
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Why choose Promesapay?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: TrendingUp, title: "Set custom goals", desc: "Any amount, any timeline" },
              { icon: Heart, title: "Multiple donation options", desc: "One-time or recurring support" },
              { icon: CheckCircle, title: "Progress tracking", desc: "Real-time updates for backers" },
              { icon: Users, title: "Community building", desc: "Engage with your supporters" }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-50 dark:bg-slate-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to start your campaign?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Join thousands of creators who have already funded their dreams
          </p>
          <Link to="/register">
            <AppButton size="lg" iconRight={ArrowRight}>
              Start Your Campaign
            </AppButton>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">GH₵2M+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total raised</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">1,000+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active campaigns</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">50K+</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Happy supporters</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
