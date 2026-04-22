import { Globe, Twitter, Instagram, Share2, Check } from "lucide-react";
import { useState } from "react";
import { getInitials } from "../../utils/formatters";
import Avatar from "../ui/Avatar";

export default function ProfileCard({ profile }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="card card-body space-y-5">
      {/* Top row — avatar + info */}
      <div className="flex items-start gap-4">
        <Avatar
          name={profile.full_name}
          src={profile.profile_picture}
          size="xl"
          className="shrink-0"
        />
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-lg font-bold text-gray-900 leading-tight truncate">
            {profile.full_name}
          </h1>
          <p className="text-sm text-gray-400 mb-3">@{profile.username}</p>

          {/* Social links */}
          <div className="flex items-center gap-2 flex-wrap">
            {profile.social_links?.twitter && (
              <a
                href={`https://twitter.com/${profile.social_links.twitter}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500
                           hover:text-sky-500 transition-colors font-medium"
              >
                <Twitter className="h-3.5 w-3.5" strokeWidth={1.75} />
                Twitter
              </a>
            )}
            {profile.social_links?.instagram && (
              <a
                href={`https://instagram.com/${profile.social_links.instagram}`}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500
                           hover:text-pink-500 transition-colors font-medium"
              >
                <Instagram className="h-3.5 w-3.5" strokeWidth={1.75} />
                Instagram
              </a>
            )}
            {profile.social_links?.website && (
              <a
                href={profile.social_links.website}
                target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500
                           hover:text-gray-900 transition-colors font-medium"
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
          {profile.bio}
        </p>
      )}

      {/* Share button */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 text-xs font-medium
                     text-gray-500 hover:text-sky-600 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-600">Link copied!</span>
            </>
          ) : (
            <>
              <Share2 className="h-3.5 w-3.5" />
              Share this page
            </>
          )}
        </button>
      </div>
    </div>
  );
}