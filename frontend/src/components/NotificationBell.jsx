import React, { useState, useEffect } from "react";
import { FiBell, FiX, FiCheck, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import notificationsAPI from "../../api/notifications";
import toast from "react-hot-toast";

/**
 * NotificationBell Component
 * Displays notification bell icon with unread count and dropdown preview
 */
const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread count on component mount and at intervals
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchRecentNotifications = async () => {
    if (loading || recentNotifications.length > 0) return;
    
    setLoading(true);
    try {
      const response = await notificationsAPI.getMyNotifications(1, 5, false);
      setRecentNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchRecentNotifications();
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setRecentNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      fetchUnreadCount();
      toast.success("Marked as read", { icon: "✓", duration: 2000 });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      setRecentNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
      fetchUnreadCount();
      toast.success("Notification deleted", { icon: "🗑️", duration: 2000 });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const getNotificationColor = (type) => {
    const colors = {
      payment_received: "bg-green-50 border-green-200",
      payment_sent: "bg-blue-50 border-blue-200",
      refund_issued: "bg-purple-50 border-purple-200",
      dispute_reported: "bg-orange-50 border-orange-200",
      dispute_resolved: "bg-green-50 border-green-200",
      security_alert: "bg-red-50 border-red-200",
      login_new_device: "bg-yellow-50 border-yellow-200",
      account_locked: "bg-red-50 border-red-200",
    };
    return colors[type] || "bg-gray-50 border-gray-200";
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
    <div className="relative">
      <style>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          10%, 20% { transform: rotate(-10deg); }
          30%, 50%, 70%, 90% { transform: rotate(10deg); }
          40%, 60%, 80% { transform: rotate(-10deg); }
        }
        .bell-ringing:hover {
          animation: bell-ring 0.5s ease-in-out;
        }
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .badge-pulse {
          animation: badge-pulse 2s ease-in-out infinite;
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dropdown-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
      
      {/* Bell Icon Button */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 bell-ringing"
        aria-label="Notifications"
      >
        <FiBell size={24} strokeWidth={unreadCount > 0 ? 2.5 : 2} />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center min-w-max px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-gradient-to-r from-red-600 to-red-500 rounded-full shadow-lg badge-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 dropdown-slide-down overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <button
              onClick={() => setShowDropdown(false)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 border-4 border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Loading...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                  <FiBell size={24} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">No notifications yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Check back later</p>
              </div>
            ) : (
              recentNotifications.map((notification, idx) => (
                <div
                  key={notification._id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all ${
                    !notification.read
                      ? "bg-blue-50 dark:bg-gray-750 border-l-4 border-l-blue-600"
                      : ""
                  } ${idx === recentNotifications.length - 1 ? "border-b-0" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left Indicator */}
                    {!notification.read && (
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatTime(notification.created_at)}
                      </p>

                      {/* Action Button */}
                      {notification.action_url && (
                        <a
                          href={notification.action_url}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline mt-2 inline-block font-medium transition-colors"
                          onClick={() => handleMarkAsRead(notification._id)}
                        >
                          View →
                        </a>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                        aria-label="Mark as read"
                        title="Mark as read"
                      >
                        <FiCheck size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 transition-all">
            <Link
              to="/notifications"
              className="text-center block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
              onClick={() => setShowDropdown(false)}
            >
              View All Notifications →
            </Link>
            <Link
              to="/notifications/preferences"
              className="text-center block text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors mt-2"
              onClick={() => setShowDropdown(false)}
            >
              Preferences ⚙️
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
