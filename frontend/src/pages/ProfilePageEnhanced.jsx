/**
 * ProfilePageEnhanced.jsx - Example of how to integrate loading states and mobile responsiveness
 * This shows best practices for using:
 * - EnhancedErrorBoundary (auto-wrapped by App.jsx)
 * - useLoadingState hook for async operations
 * - SkeletonLoader for loading states
 * - Responsive utilities for mobile optimization
 *
 * Implementation Status: EXAMPLE - Copy patterns to your pages
 */

import { useParams, Link } from "react-router-dom";
import { FiHeart, FiAlertCircle } from "react-icons/fi";
import { getProfile } from "../api/profile";
import PaymentModal from "../components/payment/PaymentModal";
import { SkeletonLoader } from "../components/common/SkeletonLoader";
import { useLoadingState } from "../hooks/useLoadingState";
import { useResponsive } from "../utils/responsiveUtils";
import { useToast } from "../hooks/useToast";
import { formatCurrency } from "../utils/formatters";
import { useState } from "react";

/**
 * PATTERN 1: Using useLoadingState for async data fetching
 * This hook handles loading, error, and retry states automatically
 */
export default function ProfilePageEnhanced() {
  const { username } = useParams();
  const { error } = useToast();
  const { isMobile } = useResponsive();
  const [modal, setModal] = useState(null);

  // This hook manages loading state and error handling for profile fetching
  const { isLoading, error: fetchError, data: profile, retry, setData } = useLoadingState(
    async () => {
      try {
        const res = await getProfile(username);
        return res.data.profile;
      } catch (err) {
        if (err.response?.status === 404) {
          throw new Error("Profile not found");
        }
        throw err;
      }
    },
    [username] // Re-fetch when username changes
  );

  // Handle payment success
  const handlePaymentSuccess = (result) => {
    const updatedProfile = result?.user ?? result;
    setData((prev) => ({ ...prev, ...updatedProfile }));
    setModal(null);
  };

  // PATTERN 2: Render loading state with SkeletonLoader
  if (isLoading) {
    return (
      <div className={isMobile ? "px-4 py-6" : "max-w-2xl mx-auto px-6 py-12"}>
        <SkeletonLoader variant="profile" />
      </div>
    );
  }

  // PATTERN 3: Render error state with retry option
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg p-6 text-center">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {fetchError.message === "Profile not found" ? "Profile Not Found" : "Error Loading Profile"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {fetchError.message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition"
            >
              Try Again
            </button>
            <Link to="/" className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white py-2 rounded font-medium transition">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // PATTERN 4: Render content with responsive layout
  if (!profile) return null;

  return (
    <div className={`${isMobile ? "px-4 py-6" : "max-w-2xl mx-auto px-6 py-12"} flex flex-col gap-6`}>
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar */}
          <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {profile.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {profile.full_name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">@{profile.username}</p>
            {profile.bio && (
              <p className="text-slate-700 dark:text-slate-300 mt-2">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats - Responsive Grid */}
        <div className={`grid gap-4 mt-6 ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Supporters</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {profile.supporter_count || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Raised</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(profile.total_raised || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">This Month</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(profile.monthly_amount || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Goal Progress - Responsive */}
      {profile.goal_amount > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">
            {profile.goal_title || "Fundraising Goal"}
          </h3>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min((profile.total_raised / profile.goal_amount) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              ${profile.total_raised} raised
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(Math.round((profile.total_raised / profile.goal_amount) * 100), 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Coffee & Donation Buttons - Full Width on Mobile */}
      <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
        <button
          onClick={() => setModal({ type: "coffee", payload: { cups: 1 } })}
          className="bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-lg font-semibold transition"
        >
          <span className="inline mr-1">🧸</span> Get me a doll
        </button>
        <button
          onClick={() => setModal({ type: "donation", payload: { amount: 10 } })}
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition"
        >
          <FiHeart size={16} className="inline mr-1" /> Make a Donation
        </button>
      </div>

      {/* Payment Modal */}
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
