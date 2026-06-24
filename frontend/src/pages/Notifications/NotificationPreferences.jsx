import React, { useState, useEffect } from "react";
import { FiSettings, FiSave, FiClock, FiMail, FiSmartphone, FiDollarSign, FiUpload, FiCreditCard, FiAlertTriangle, FiCheckCircle, FiShield, FiSmartphone as FiMobile, FiLock, FiKey, FiBell, FiVolume2 } from "react-icons/fi";
import notificationsAPI from "../../api/notifications";
import toast from "react-hot-toast";

/**
 * NotificationPreferences Component
 * Allows users to manage notification preferences and settings
 */
const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("channels");

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getPreferences();
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (channel) => {
    setPreferences((prev) => ({
      ...prev,
      [channel]: !prev[channel],
    }));
  };

  const handleDigestToggle = (enabled) => {
    setPreferences((prev) => ({
      ...prev,
      digest_enabled: enabled,
    }));
  };

  const handleDigestFrequencyChange = (frequency) => {
    setPreferences((prev) => ({
      ...prev,
      digest_frequency: frequency,
    }));
  };

  const handleQuietHoursToggle = (enabled) => {
    setPreferences((prev) => ({
      ...prev,
      quiet_hours_enabled: enabled,
    }));
  };

  const handleQuietHourChange = (field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationTypeToggle = (type, channel) => {
    setPreferences((prev) => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: {
          ...prev.notification_types[type],
          [channel]: !prev.notification_types[type][channel],
        },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationsAPI.updatePreferences(preferences);
      toast.success("Preferences saved successfully");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 font-semibold">Failed to load preferences</p>
        </div>
      </div>
    );
  }

  const notificationTypes = [
    { key: "payment_received", label: "Payment Received", icon: FiDollarSign },
    { key: "payment_sent", label: "Payment Sent", icon: FiUpload },
    { key: "refund_issued", label: "Refund Issued", icon: FiCreditCard },
    { key: "dispute_reported", label: "Dispute Reported", icon: FiAlertTriangle },
    { key: "dispute_resolved", label: "Dispute Resolved", icon: FiCheckCircle },
    { key: "security_alert", label: "Security Alert", icon: FiShield },
    { key: "login_new_device", label: "New Device Login", icon: FiMobile },
    { key: "account_locked", label: "Account Locked", icon: FiLock },
    { key: "password_changed", label: "Password Changed", icon: FiKey },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pref-section {
          animation: fadeInUp 0.4s ease-out;
        }
      `}</style>
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl shadow-sm">
              <FiSettings className="text-blue-600 dark:text-blue-400" size={36} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Notification Preferences
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Take control of your notification settings
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {[
            { id: "channels", label: "Communication Channels", icon: FiVolume2 },
            { id: "types", label: "Notification Types", icon: FiBell },
            { id: "delivery", label: "Delivery Settings", icon: FiSettings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 border-b-2 transition-all font-medium whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              } rounded-t-lg`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Communication Channels Tab */}
          {activeTab === "channels" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-200 dark:border-gray-700 pref-section">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Choose your preferred communication channels
              </h2>

              {/* Email */}
              <label className="flex items-center justify-between p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-all mb-4 group">
                <div className="flex items-center gap-4">
                  <FiMail size={28} className="text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">Email</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.email_enabled}
                  onChange={() => handleChannelToggle("email_enabled")}
                  className="w-6 h-6 rounded-lg cursor-pointer accent-blue-600"
                />
              </label>

              {/* Push Notifications */}
              <label className="flex items-center justify-between p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 cursor-pointer transition-all mb-4 group">
                <div className="flex items-center gap-4">
                  <FiSmartphone size={28} className="text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors">
                      Browser Push
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive browser push notifications
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.push_enabled}
                  onChange={() => handleChannelToggle("push_enabled")}
                  className="w-6 h-6 rounded-lg cursor-pointer accent-blue-600"
                />
              </label>

              {/* SMS */}
              <label className="flex items-center justify-between p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 cursor-pointer transition-all mb-4 group opacity-60">
                <div className="flex items-center gap-4">
                  <FiSmartphone size={28} className="text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">SMS</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Receive text messages (coming soon)
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.sms_enabled}
                  disabled
                  className="w-6 h-6 rounded-lg cursor-not-allowed"
                />
              </label>

              {/* In-App */}
              <label className="flex items-center justify-between p-5 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10 cursor-pointer transition-all group">
                <div className="flex items-center gap-4">
                  <FiSettings size={28} className="text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">
                      In-App Notifications
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      See notifications in the app
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.in_app_enabled}
                  onChange={() => handleChannelToggle("in_app_enabled")}
                  className="w-6 h-6 rounded-lg cursor-pointer accent-blue-600"
                />
              </label>
            </div>
          )}

          {/* Notification Types Tab */}
          {activeTab === "types" && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Control notifications per type
              </h2>
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div
                    key={type.key}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <type.icon className="text-2xl" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {type.label}
                        </h3>
                      </div>
                    </div>

                    {/* Channel toggles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {["email", "push", "sms", "in_app"].map((channel) => {
                        const isDisabled =
                          channel === "sms" || !preferences[`${channel}_enabled`];
                        return (
                          <label
                            key={channel}
                            className={`flex items-center gap-2 cursor-pointer ${
                              isDisabled ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                preferences.notification_types[type.key]?.[channel] || false
                              }
                              onChange={() =>
                                handleNotificationTypeToggle(type.key, channel)
                              }
                              disabled={isDisabled}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                              {channel === "in_app" ? "In-app" : channel}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Settings Tab */}
          {activeTab === "delivery" && (
            <div className="space-y-6">
              {/* Digest Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Email Digest
                </h2>
                <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferences.digest_enabled}
                    onChange={(e) => handleDigestToggle(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Receive email digests
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get a summary of your notifications instead of individual emails
                    </p>
                  </div>
                </label>

                {preferences.digest_enabled && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Digest Frequency
                    </p>
                    <div className="space-y-2">
                      {["daily", "weekly", "never"].map((freq) => (
                        <label
                          key={freq}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="digest"
                            value={freq}
                            checked={preferences.digest_frequency === freq}
                            onChange={(e) =>
                              handleDigestFrequencyChange(e.target.value)
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {freq === "never" ? "Never" : `${freq.charAt(0).toUpperCase() + freq.slice(1)} Digest`}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quiet Hours Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Quiet Hours
                </h2>
                <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={preferences.quiet_hours_enabled}
                    onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Enable quiet hours
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pause notifications during specific hours
                    </p>
                  </div>
                </label>

                {preferences.quiet_hours_enabled && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        <FiClock size={16} className="inline mr-2" />
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={preferences.quiet_hours_start}
                        onChange={(e) =>
                          handleQuietHourChange("quiet_hours_start", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        <FiClock size={16} className="inline mr-2" />
                        End Time
                      </label>
                      <input
                        type="time"
                        value={preferences.quiet_hours_end}
                        onChange={(e) =>
                          handleQuietHourChange("quiet_hours_end", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={() => fetchPreferences()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <FiSave size={18} />
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
