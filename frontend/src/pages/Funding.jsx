import { Heart, TrendingUp, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import AppButton from "../components/ui/AppButton";

export default function Funding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      {/* Back Button */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <Link to="/">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </button>
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side */}
          <div>
            <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-300 text-rose-800 text-xs font-medium px-3 py-1 rounded-full mb-6">
              <Heart className="h-3.5 w-3.5" />
              Project Funding
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Fund Your Big Dreams
            </h1>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Set a funding goal and let your supporters help you achieve it. Whether it's a creative project, business venture, or personal goal—get backed by people who believe in you.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Set custom funding goals",
                "Track progress with visual updates",
                "Multiple donation options",
                "Transparent milestone tracking"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Link to="/register">
                <AppButton size="lg" className="bg-rose-600 hover:bg-rose-700">
                  Start Funding Campaign
                </AppButton>
              </Link>
              <Link to="/u/demo">
                <AppButton variant="secondary" size="lg">
                  View Example
                </AppButton>
              </Link>
            </div>
          </div>

          {/* Right side - Progress cards */}
          <div className="space-y-4">
            {[
              { creator: "Ama Boateng", goal: "GH₵5,000", raised: "GH₵3,200", percent: 64 },
              { creator: "Kwame Opoku", goal: "GH₵10,000", raised: "GH₵7,850", percent: 78 },
              { creator: "Nana Yaa", goal: "GH₵2,000", raised: "GH₵2,000", percent: 100 }
            ].map((campaign) => (
              <div key={campaign.creator} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{campaign.creator}</h3>
                  {campaign.percent === 100 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Funded
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">{campaign.raised} raised</span>
                  <span className="font-semibold text-rose-600">{campaign.percent}%</span>
                </div>
                <div className="progress-bar mb-2">
                  <div
                    className="progress-fill bg-rose-500"
                    style={{ width: `${campaign.percent}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">Goal: {campaign.goal}</p>
                <button className="btn btn-sm btn-primary justify-center w-full mt-3">
                  <Heart className="h-3.5 w-3.5" />
                  Support This Campaign
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mt-16 pt-16 border-t border-rose-200">
          {[
            { emoji: "💰", value: "GH₵2M+", label: "Raised" },
            { emoji: "🎯", value: "1,000+", label: "Active Campaigns" },
            { emoji: "👥", value: "50,000+", label: "Supporters" }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl mb-2">{stat.emoji}</div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
