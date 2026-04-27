import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProfile } from "../api/profile";
import ProfileCard from "../components/profile/ProfileCard";
import ProgressBar from "../components/profile/ProgressBar";
import DonateBox from "../components/profile/DonateBox";
import CoffeeBox from "../components/profile/CoffeeBox";
import SupportersList from "../components/profile/SupportersList";
import PaymentModal from "../components/payment/PaymentModal";
import { ProfileSkeleton } from "../components/common/Skeleton";
import { useToast } from "../hooks/useToast";
import { AlertCircle } from "lucide-react";
import AppButton from "../components/ui/AppButton";

export default function ProfilePage() {
  const { username }           = useParams();
  const { error }              = useToast();
  const [profile, setProfile]  = useState(null);
  const [loading, setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modal, setModal]      = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile(username);
        setProfile(res.data.profile);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        else error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const handlePaymentSuccess = (updatedUser) => {
    setProfile((p) => ({ ...p, ...updatedUser }));
    setModal(null);
  };

  if (loading) return <ProfileSkeleton />;

  if (notFound) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-slate-400 dark:text-slate-500" strokeWidth={1.75} />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">Profile not found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium">@{username}</span> doesn't exist on Promesapay.
        </p>
      </div>
      <Link to="/">
        <AppButton variant="secondary">Back to home</AppButton>
      </Link>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-10 animate-fade-in">
      <div className="space-y-4">
        <ProfileCard user={profile} />

        {profile.goal_amount > 0 && (
          <ProgressBar
            raised={profile.total_raised}
            goal={profile.goal_amount}
            title={profile.goal_title}
          />
        )}

        <CoffeeBox
          onBuy={(payload) => setModal({ type: "coffee", payload })}
        />

        <DonateBox
          onDonate={(payload) => setModal({ type: "donation", payload })}
        />

        <SupportersList supporters={profile.recent_supporters} />
      </div>

      {modal && (
        <PaymentModal
          type={modal.type}
          payload={modal.payload}
          recipient={profile}
          onClose={() => setModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}