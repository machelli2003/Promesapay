import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FiShare2,
  FiCopy,
  FiCheck,
  FiAlertCircle,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import {
  getCampaign,
  getCampaignUpdates,
  getCampaignComments,
} from "../api/campaigns";
import CampaignProgress from "../components/campaigns/CampaignProgress";
import CampaignDonateBox from "../components/campaigns/CampaignDonateBox";
import CampaignUpdates from "../components/campaigns/CampaignUpdates";
import CampaignComments from "../components/campaigns/CampaignComments";
import PaymentModal from "../components/payment/PaymentModal";
import Avatar from "../components/ui/Avatar";
import AppButton from "../components/ui/AppButton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import Spinner from "../components/common/Spinner";

export default function CampaignPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { success } = useToast();
  const [campaign, setCampaign] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const [c, u, cm] = await Promise.all([
        getCampaign(slug),
        getCampaignUpdates(slug),
        getCampaignComments(slug),
      ]);
      setCampaign(c.data.campaign);
      setUpdates(u.data.updates);
      setComments(cm.data.comments);
    } catch (err) {
      if (err.status === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [slug]);

  const isOwner = user?.id === campaign?.owner_id;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: campaign.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePaymentSuccess = (data) => {
    if (data?.campaign) {
      setCampaign((c) => ({ ...c, ...data.campaign }));
    } else if (data) {
      setCampaign((c) => ({
        ...c,
        amount_raised: (c.amount_raised || 0) + (modal?.payload?.amount || 0),
        donor_count: (c.donor_count || 0) + 1,
      }));
    }
    setModal(null);
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <FiAlertCircle className="h-10 w-10 text-slate-400" />
        <h2 className="text-lg font-semibold">Campaign not found</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          This campaign may have been removed, or the link might be incorrect.
        </p>
        <Link to="/campaigns">
          <AppButton variant="secondary">Browse campaigns</AppButton>
        </Link>
      </div>
    );
  }

  const owner = campaign.owner;

  return (
    <div className="animate-fade-in">
      {/* Hero: now carries real content instead of an empty gradient strip */}
      <div className="bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 md:pt-14 md:pb-24">
          <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-white/70 dark:bg-slate-900/40 text-sky-700 dark:text-sky-300 mb-4">
            {campaign.category}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 max-w-3xl leading-tight">
            {campaign.title}
          </h1>

          <div className="flex items-center justify-between gap-4 mt-6">
            <Link to={`/u/${owner?.username}`} className="flex items-center gap-3 group">
              <Avatar name={owner?.full_name} src={owner?.profile_picture} size="md" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-600">
                  {owner?.full_name}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">@{owner?.username}</p>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              <AppButton
                variant="secondary"
                size="sm"
                icon={copied ? FiCheck : FiCopy}
                onClick={handleShare}
                aria-label="Copy campaign link"
              >
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy link"}</span>
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                icon={FiShare2}
                onClick={handleShare}
                aria-label="Share campaign"
              >
                <span className="hidden sm:inline">Share</span>
              </AppButton>
              {isOwner && (
                <Link to="/dashboard">
                  <AppButton variant="ghost" size="sm" icon={FiUser}>
                    <span className="hidden sm:inline">My dashboard</span>
                  </AppButton>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-12 pb-16">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Sidebar moved first in source order on mobile via flex/grid reordering,
              but kept second visually on desktop through the grid template above */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="card card-body">
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Story
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {campaign.story || "No story provided yet."}
                </p>
              </div>
            </div>

            <CampaignUpdates
              slug={slug}
              updates={updates}
              isOwner={isOwner}
              onPosted={load}
            />

            <CampaignComments
              slug={slug}
              comments={comments}
              onPosted={load}
            />
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start order-1 lg:order-2">
            <CampaignProgress campaign={campaign} />

            {campaign.status === "active" ? (
              <CampaignDonateBox
                paymentType={campaign.payment_type || "donation"}
                onDonate={(payload) =>
                  setModal({ type: campaign.payment_type || "donation", payload, campaign })
                }
              />
            ) : (
              <div className="card card-body text-center text-sm text-slate-500">
                This campaign is no longer accepting donations.
              </div>
            )}

            <div className="card card-body">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <FiUsers className="h-4 w-4 text-slate-400" />
                  Recent supporters
                </h4>
                {campaign.donor_count > 0 && (
                  <span className="text-xs text-slate-500">
                    {campaign.donor_count} total
                  </span>
                )}
              </div>

              {campaign.recent_donors?.length > 0 ? (
                <ul className="space-y-3">
                  {campaign.recent_donors.map((d) => (
                    <li key={d.id} className="flex items-center gap-3">
                      <Avatar name={d.donor_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                          {d.donor_name}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 shrink-0">
                        GH₵{d.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  No donations yet — be the first to support this campaign.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <PaymentModal
          type={modal.type}
          payload={modal.payload}
          recipient={{
            username: owner?.username,
            full_name: owner?.full_name,
          }}
          campaignSlug={slug}
          onClose={() => setModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}