import axios from 'axios';
import { API_ORIGIN } from '../utils/constants';

const API_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: API_URL,
  });

  // Add JWT token to requests
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

const axiosInstance = createAxiosInstance();

export const monitoringAPI = {
  // Health Checks
  healthCheck: () =>
    axiosInstance.get('/monitoring/health'),

  getDetailedHealthCheck: () =>
    axiosInstance.get('/monitoring/health/detailed'),

  // System Statistics
  getSystemStats: () =>
    axiosInstance.get('/monitoring/stats/overview'),

  getDailyStats: (days = 30) =>
    axiosInstance.get('/monitoring/stats/daily', { params: { days } }),

  getHourlyStats: () =>
    axiosInstance.get('/monitoring/stats/hourly'),

  // Error Tracking
  getErrorLogs: (hours = 24, limit = 100) =>
    axiosInstance.get('/monitoring/errors', { params: { hours, limit } }),

  getErrorSummary: (hours = 24) =>
    axiosInstance.get('/monitoring/errors/summary', { params: { hours } }),

  // Activity
  getRecentActivity: (limit = 50) =>
    axiosInstance.get('/monitoring/activity/recent', { params: { limit } }),

  getActivitySummary: (hours = 24) =>
    axiosInstance.get('/monitoring/activity/summary', { params: { hours } }),

  // Performance
  getEndpointPerformance: () =>
    axiosInstance.get('/monitoring/performance/endpoints'),

  getDatabasePerformance: () =>
    axiosInstance.get('/monitoring/performance/database'),

  // Status
  getCurrentStatus: () =>
    axiosInstance.get('/monitoring/status/current'),

  // Alerts
  getAlerts: () =>
    axiosInstance.get('/monitoring/alerts'),
};

export default monitoringAPI;
