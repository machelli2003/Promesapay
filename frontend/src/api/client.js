import axios from "axios";
import { API_BASE } from "../utils/constants";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const csrfToken = localStorage.getItem("csrf_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    // Add request ID for tracking
    config.headers["X-Request-ID"] = `${Date.now()}-${Math.random()}`;
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, code, message } = error;

    // Handle network errors
    if (code === "ECONNABORTED") {
      console.error("Request timeout");
      toast.error("Request timeout. Please try again.");
      return Promise.reject(new Error("Request timeout"));
    }

    if (!response) {
      console.error("Network error:", message);
      toast.error("Network error. Please check your connection.");
      return Promise.reject(error);
    }

    // Handle API errors
    const { status, data } = response;
    const errorMessage = data?.error || data?.message || "An error occurred";
    const errorCode = data?.error_code || "UNKNOWN_ERROR";

    // Log errors
    console.error(`API Error [${status}] ${errorCode}:`, errorMessage);

    // Handle specific status codes
    if (status === 401) {
      // Unauthorized - clear auth and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      toast.error("Session expired. Please login again.");
    } else if (status === 403) {
      toast.error("You don't have permission to perform this action.");
    } else if (status === 429) {
      toast.error("Too many requests. Please try again later.");
    } else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    } else {
      toast.error(errorMessage);
    }

    // Create error object with standardized format
    const apiError = new Error(errorMessage);
    apiError.status = status;
    apiError.code = errorCode;
    apiError.response = data;

    return Promise.reject(apiError);
  }
);

export default api;
