import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

export const disputesAPI = {
  // User Endpoints
  reportDispute: (data) =>
    axiosInstance.post('/disputes/report', data),

  getMyDisputes: (page = 1, limit = 10, status = 'all') =>
    axiosInstance.get('/disputes/my-disputes', {
      params: { page, limit, status },
    }),

  // Admin Endpoints
  getAllDisputes: (page = 1, limit = 20, status = 'all', priority = 'all') =>
    axiosInstance.get('/admin/disputes', {
      params: { page, limit, status, priority },
    }),

  getDisputeDetails: (disputeId) =>
    axiosInstance.get(`/admin/disputes/${disputeId}`),

  updateDisputeStatus: (disputeId, data) =>
    axiosInstance.put(`/admin/disputes/${disputeId}/status`, data),

  issueRefund: (disputeId, data) =>
    axiosInstance.post(`/admin/disputes/${disputeId}/refund`, data),

  getDisputeStats: () =>
    axiosInstance.get('/admin/disputes/stats/overview'),
};

export default disputesAPI;
