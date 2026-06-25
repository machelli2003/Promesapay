import React, { useState, useEffect } from "react";
import { FiCheck, FiTrash2, FiSettings, FiBell, FiSend, FiAlertTriangle, FiShield, FiSmartphone, FiLock, FiKey } from "react-icons/fi";
import CediSign from "../../components/common/CediSign";
import notificationsAPI from "../../api/notifications";
import toast from "react-hot-toast";

/**
 * NotificationCenter Component
 * Full notification center page with list, filtering, and actions
 */
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [filterType, setFilterType] = useState(null); // New filter state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const LIMIT = 20;

  // Notification types for filtering
  const NOTIFICATION_ICONS = {
    payment_received: CediSign,
    payment_sent: FiSend,
    refund_issued: CediSign,
    dispute_reported: FiAlertTriangle,
    dispute_resolved: FiCheck,
    security_alert: FiShield,
    login_new_device: FiSmartphone,
    account_locked: FiLock,
    password_changed: FiKey,
  };

  const notificationTypes = [
    { key: "payment_received", label: "Payment Received" },
    { key: "payment_sent", label: "Payment Sent" },
    { key: "refund_issued", label: "Refund Issued" },
    { key: "dispute_reported", label: "Dispute Reported" },
    { key: "dispute_resolved", label: "Dispute Resolved" },
    { key: "security_alert", label: "Security Alert" },
    { key: "login_new_device", label: "New Device Login" },
    { key: "account_locked", label: "Account Locked" },
    { key: "password_changed", label: "Password Changed" },
  ];

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, [currentPage, unreadOnly, filterType]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsAPI.getMyNotifications(
        currentPage,
        LIMIT,
        unreadOnly
      );
      let filtered = response.data.notifications || [];
      
      // Apply type filter client-side
      if (filterType) {
        filtered = filtered.filter((n) => n.type === filterType);
      }
      
      setNotifications(filtered);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const handleToggleSelect = (notificationId) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(notificationId)) {
      newSelected.delete(notificationId);
    } else {
      newSelected.add(notificationId);
    }
    setSelectedNotifications(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === notifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(notifications.map((n) => n._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.size === 0) {
      toast.error("No notifications selected");
      return;
    }

    const deletePromises = Array.from(selectedNotifications).map((id) =>
      notificationsAPI.deleteNotification(id)
    );

    try {
      await Promise.all(deletePromises);
      setNotifications((prev) =>
        prev.filter((notif) => !selectedNotifications.has(notif._id))
      );
      setSelectedNotifications(new Set());
      toast.success(`${selectedNotifications.size} notification(s) deleted`);
    } catch (error) {
      console.error("Error deleting notifications:", error);
      toast.error("Failed to delete some notifications");
    }
  };

  const getNotificationIcon = (type) => {
    const Icon = NOTIFICATION_ICONS[type] || FiBell;
    return <Icon size={24} className="text-blue-600 dark:text-blue-400" />;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notification-item {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .selected-animation {
          animation: slideIn 0.2s ease-out;
        }
      `}</style>
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl shadow-sm">
                <FiBell className="text-blue-600 dark:text-blue-400" size={32} strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Stay updated with your activity
                </p>
              </div>
            </div>
            <a
              href="/notifications/preferences"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FiSettings size={20} />
              <span className="font-medium">Preferences</span>
            </a>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={unreadOnly}
                    onChange={(e) => {
                      setUnreadOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Unread only
                  </span>
                </label>

                {/* Filter by Type Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      filterType
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span>{filterType ? "Filtered" : "Filter by Type"}</span>
                    {filterType && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilterType(null);
                        }}
                        className="ml-1 hover:opacity-70 transition-colors"
                      >
                        <FiCheck size={14} />
                      </button>
                    )}
                  </button>
                  
                  {showFilterDropdown && (
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setFilterType(null);
                            setShowFilterDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          Show All
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notificationTypes.map((type) => (
                          <button
                            key={type.key}
                            onClick={() => {
                              setFilterType(type.key);
                              setShowFilterDropdown(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all ${
                              filterType === type.key
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedNotifications.size > 0 && (
                  <>
                    <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                        {selectedNotifications.size} selected
                      </span>
                    </div>
                    <button
                      onClick={handleBulkDelete}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors selected-animation"
                    >
                      Delete Selected
                    </button>
                  </>
                )}
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Mark All as Read
                </button>
              </div>
          </div>
        </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 mt-8">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-12 h-12 border-4 border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <FiBell size={32} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                {unreadOnly
                  ? "No unread notifications"
                  : "No notifications yet"}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                {!unreadOnly && "Your notifications will appear here"}
              </p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 p-5 flex items-start gap-4 notification-item hover:-translate-y-1 ${
                    notification.read
                      ? "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                      : "border-blue-500 hover:border-blue-600"
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification._id)}
                    onChange={() => handleToggleSelect(notification._id)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 cursor-pointer accent-blue-600 flex-shrink-0"
                  />

                  {/* Notification Icon */}
                  <div className="flex-shrink-0 mt-1 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`font-bold text-lg ${
                              notification.read
                                ? "text-gray-900 dark:text-white"
                                : "text-blue-900 dark:text-blue-100 font-bold"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <p className="text-gray-500 dark:text-gray-400 font-medium">
                            {formatTime(notification.created_at)}
                          </p>
                          {notification.type && (
                            <p className="inline-block px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium capitalize">
                              {notification.type.replace(/_/g, " ")}
                            </p>
                          )}
                        </div>

                        {/* Action Link */}
                        {notification.action_url && (
                          <a
                            href={notification.action_url}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold hover:underline mt-3 inline-block transition-colors"
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            View Details →
                          </a>
                        )}
                      </div>

                      {/* Badge */}
                      {!notification.read && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full flex-shrink-0">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                        title="Mark as read"
                      >
                        <FiCheck size={20} strokeWidth={2} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Delete"
                    >
                      <FiTrash2 size={20} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700 dark:text-gray-300"
            >
              ← Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2.5 rounded-lg transition-all font-medium ${
                  currentPage === page
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-gray-700 dark:text-gray-300"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
