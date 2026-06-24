import { useState } from "react";
import { FiX, FiCopy, FiAlertCircle, FiLock, FiMail, FiCalendar, FiDollarSign, FiCheck } from "react-icons/fi";
import { adminAPI } from "../../api/admin";
import { useToast } from "../../hooks/useToast";
import AppButton from "../../components/ui/AppButton";

export default function UserDetailModal({ user, onClose, onStatusChanged }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [adminNotes, setAdminNotes] = useState(user.admin_notes);
  const [savingNotes, setSavingNotes] = useState(false);

  const handleSuspendUser = async () => {
    if (!window.confirm("Are you sure you want to suspend this user?")) return;
    
    try {
      setLoading(true);
      const reason = prompt("Enter suspension reason:");
      if (!reason) return;

      await adminAPI.updateUserStatus(user._id, {
        action: "suspend",
        reason
      });
      success("User suspended successfully");
      onStatusChanged();
    } catch (err) {
      error(err.response?.data?.error || "Failed to suspend user");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async () => {
    try {
      setLoading(true);
      await adminAPI.updateUserStatus(user._id, {
        action: "activate"
      });
      success("User activated successfully");
      onStatusChanged();
    } catch (err) {
      error(err.response?.data?.error || "Failed to activate user");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm("Send password reset email to this user?")) return;
    
    try {
      setLoading(true);
      await adminAPI.resetUserPassword(user._id);
      success("Password reset email sent successfully");
    } catch (err) {
      error(err.response?.data?.error || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await adminAPI.updateAdminNotes(user._id, {
        notes: adminNotes
      });
      success("Admin notes updated");
    } catch (err) {
      error("Failed to update notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    success("Copied to clipboard");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user.full_name}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">@{user.username}</p>
          </div>
          <button onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-6 pt-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "info"
                ? "text-sky-600 dark:text-sky-400 border-sky-600 dark:border-sky-400"
                : "text-slate-600 dark:text-slate-400 border-transparent"
            }`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "activity"
                ? "text-sky-600 dark:text-sky-400 border-sky-600 dark:border-sky-400"
                : "text-slate-600 dark:text-slate-400 border-transparent"
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "admin"
                ? "text-sky-600 dark:text-sky-400 border-sky-600 dark:border-sky-400"
                : "text-slate-600 dark:text-slate-400 border-transparent"
            }`}
          >
            Admin Actions
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Information Tab */}
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Status Alert */}
              {user.status === "suspended" && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                  <FiAlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-300">Account Suspended</p>
                    <p className="text-sm text-red-800 dark:text-red-400">{user.suspension_reason}</p>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-900 dark:text-white font-medium">{user.email}</span>
                    <button
                      onClick={() => copyToClipboard(user.email)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <FiCopy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
{user.email_verified ? <><FiCheck size={10} className="inline mr-0.5" /> Verified</> : "Pending verification"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Username</label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">@{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Member Since</label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Role</label>
                  <p className="text-slate-900 dark:text-white font-medium mt-1 capitalize">{user.role}</p>
                </div>
              </div>

              {/* Security Info */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Security</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Two-Factor Auth</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
{user.security.two_factor_enabled ? <><FiCheck size={10} className="inline mr-0.5" /> Enabled</> : "Disabled"}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Last Login</p>
                    <p className="text-slate-900 dark:text-white">
                      {user.security.last_login
                        ? new Date(user.security.last_login).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Financial</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Received</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      GH₵{user.total_received.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Earned</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      GH₵{user.total_earned.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Donations Count</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{user.total_donations}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
                {user.recent_activity && user.recent_activity.length > 0 ? (
                  <div className="space-y-3">
                    {user.recent_activity.map((activity) => (
                      <div key={activity._id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white capitalize">{activity.action}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <pre className="text-xs text-slate-600 dark:text-slate-400 mt-2 overflow-auto bg-slate-100 dark:bg-slate-800 p-2 rounded">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400">No activity recorded</p>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Transactions</h3>
                {user.recent_transactions && user.recent_transactions.length > 0 ? (
                  <div className="space-y-3">
                    {user.recent_transactions.map((transaction) => (
                      <div key={transaction._id} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white capitalize">{transaction.type}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white">GH₵{transaction.amount.toFixed(2)}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{transaction.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400">No transactions recorded</p>
                )}
              </div>
            </div>
          )}

          {/* Admin Actions Tab */}
          {activeTab === "admin" && (
            <div className="space-y-6">
              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this user..."
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  rows="4"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  {savingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>

              {/* Account Status Actions */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Account Status</h3>
                <div className="space-y-3">
                  {user.status === "active" ? (
                    <AppButton
                      onClick={handleSuspendUser}
                      loading={loading}
                      className="w-full bg-red-600 hover:bg-red-700"
                      iconLeft={FiLock}
                    >
                      Suspend User
                    </AppButton>
                  ) : (
                    <AppButton
                      onClick={handleActivateUser}
                      loading={loading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Activate User
                    </AppButton>
                  )}
                </div>
              </div>

              {/* Password Reset */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Security</h3>
                <AppButton
                  onClick={handleResetPassword}
                  loading={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  iconLeft={FiMail}
                >
                  Send Password Reset Email
                </AppButton>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
