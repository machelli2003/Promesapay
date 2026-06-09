import axios from "axios";
import { API_ORIGIN } from "../utils/constants";

const API_URL = API_ORIGIN || "";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAPI = {
  // User Management
  getUsers: (params) =>
    instance.get("/api/admin/users", { params }),

  getUserDetails: (userId) =>
    instance.get(`/api/admin/users/${userId}`),

  updateUserStatus: (userId, data) =>
    instance.put(`/api/admin/users/${userId}/status`, data),

  resetUserPassword: (userId) =>
    instance.post(`/api/admin/users/${userId}/password-reset`),

  updateAdminNotes: (userId, data) =>
    instance.put(`/api/admin/users/${userId}/notes`, data),

  getUserActivity: (userId, params) =>
    instance.get(`/api/admin/users/${userId}/activity`, { params }),

  // Statistics
  getAdminStats: () =>
    instance.get("/api/admin/stats/overview"),

  getDailyRevenue: () =>
    instance.get("/api/admin/stats/daily-revenue"),

  // Disputes (Phase 3.2)
  getDisputes: (params) =>
    instance.get("/api/admin/disputes", { params }),

  getDisputeDetails: (disputeId) =>
    instance.get(`/api/admin/disputes/${disputeId}`),

  updateDisputeStatus: (disputeId, data) =>
    instance.put(`/api/admin/disputes/${disputeId}/status`, data),

  issueRefund: (disputeId, data) =>
    instance.post(`/api/admin/disputes/${disputeId}/refund`, data),
};

export default instance;
