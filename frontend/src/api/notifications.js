import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Add JWT token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const notificationsAPI = {
  // Get user's notifications
  getMyNotifications: (page = 1, limit = 20, unreadOnly = false) =>
    axiosInstance.get("/notifications/my-notifications", {
      params: { page, limit, unread_only: unreadOnly },
    }),

  // Get unread count
  getUnreadCount: () =>
    axiosInstance.get("/notifications/unread-count"),

  // Mark notification as read
  markAsRead: (notificationId) =>
    axiosInstance.put(`/notifications/${notificationId}/read`),

  // Mark all notifications as read
  markAllAsRead: () =>
    axiosInstance.put("/notifications/read-all"),

  // Delete notification
  deleteNotification: (notificationId) =>
    axiosInstance.delete(`/notifications/${notificationId}`),

  // Get notification preferences
  getPreferences: () =>
    axiosInstance.get("/notifications/preferences"),

  // Update notification preferences
  updatePreferences: (preferences) =>
    axiosInstance.put("/notifications/preferences", preferences),

  // Send notification (system/admin)
  sendNotification: (recipientId, type, title, message, actionUrl = null, data = null) =>
    axiosInstance.post("/notifications/send", {
      recipient_id: recipientId,
      type,
      title,
      message,
      action_url: actionUrl,
      data,
    }),
};

export default notificationsAPI;
