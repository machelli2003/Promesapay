import axios from "axios";
import { API_BASE } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Add request interceptor to include token in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const changePassword = (data) => api.put("/auth/change-password", data);

// New
export const googleLogin = () => window.location.href = "/api/auth/google/login";