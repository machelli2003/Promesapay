import { Coffee, Heart, Share2, ExternalLink, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import AppButton from "../ui/AppButton";
import Avatar from "../ui/Avatar";

export default function ProfileCard({ user, isOwnProfile = false }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-violet-600 to-purple-600" />

      {/* Profile Info */}
      <div className="px-6 pb-6">
        <div className="flex items-end -mt-12 mb-4">
          <Avatar
            name={user.full_name}
            src={user.profile_picture}
            size="xl"
            className="ring-4 ring-white dark:ring-slate-900"
          />
          <div className="ml-4 mb-1">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {user.full_name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              @{user.username}
            </p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">
            {user.bio}
          </p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {user.total_received || 0}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Raised</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {user.supporters_count || 0}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Supporters</p>
          </div>
          <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {user.campaigns_count || 0}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Campaigns</p>
          </div>
        </div>

        {/* Goal Progress */}
        {user.goal_amount > 0 && (
          <div className="mb-6 p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {user.goal_title || "Funding Goal"}
              </span>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                {Math.round((user.total_received / user.goal_amount) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 transition-all duration-500"
                style={{
                  width: `${Math.min((user.total_received / user.goal_amount) * 100, 100)}%`
                }}
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
              {user.total_received || 0} of {user.goal_amount} raised
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link to={`/coffee/${user.username}`} className="flex-1">
            <AppButton
              variant="secondary"
              className="w-full"
              icon={Coffee}
            >
              Buy Coffee
            </AppButton>
          </Link>
          <Link to={`/donate/${user.username}`} className="flex-1">
            <AppButton
              className="w-full"
              icon={Heart}
            >
              Donate
            </AppButton>
          </Link>
        </div>

        {/* Share Button */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `Support ${user.full_name}`,
                url: window.location.href
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors py-2"
        >
          <Share2 className="h-4 w-4" />
          Share Profile
        </button>

        {/* Social Links */}
        {user.social_links && (user.social_links.twitter || user.social_links.website) && (
          <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            {user.social_links.website && (
              <a
                href={user.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
            {user.social_links.twitter && (
              <a
                href={`https://twitter.com/${user.social_links.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <span className="text-sm">@{user.social_links.twitter}</span>
              </a>
            )}
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          <Calendar className="h-4 w-4" />
          <span>
            Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  );
}
