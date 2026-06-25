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
  async (config) => {
    const token = localStorage.getItem("token");
    let csrfToken = localStorage.getItem("csrf_token");

    // If this is a mutating request and we don't have a CSRF token,
    // fetch it from the backend (uses the session cookie) and store it.
    const mutating = ["post", "put", "patch", "delete"].includes(
      (config.method || "").toLowerCase()
    );
    if (mutating && !csrfToken) {
      try {
        const res = await fetch(`${API_BASE}/auth/csrf-token`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.csrf_token) {
            localStorage.setItem("csrf_token", data.csrf_token);
            csrfToken = data.csrf_token;
            console.debug("Fetched CSRF token from server");
          }
        }
      } catch (err) {
        console.debug("Failed to refresh CSRF token:", err);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (csrfToken) {
      config.headers["X-CSRF-Token"] = csrfToken;
    }
    console.debug("CSRF token attached", { csrfToken: !!csrfToken, mutating, url: config.url });
    // Add request ID for tracking
    config.headers["X-Request-ID"] = `${Date.now()}-${Math.random()}`;
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

async function refreshCsrfToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/csrf-token`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.csrf_token) {
        localStorage.setItem("csrf_token", data.csrf_token);
        console.debug("refreshCsrfToken: stored csrf_token", data.csrf_token?.slice(0, 10));
        return data.csrf_token;
      }
    }
  } catch (err) {
    console.debug("refreshCsrfToken failed:", err);
  }
  return null;
}

// Response interceptor with error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { response, code, message, config } = error;

    if (response?.status === 403 && response.data?.message === "Invalid or missing CSRF token" && config && !config._csrfRetry) {
      console.debug("CSRF token invalid, refreshing and retrying request", { url: config.url });
      localStorage.removeItem("csrf_token");
      const csrfToken = await refreshCsrfToken();
      if (csrfToken) {
        config.headers = config.headers || {};
        config.headers["X-CSRF-Token"] = csrfToken;
        config._csrfRetry = true;
        return api(config);
      }
    }

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
      const msg =
        data?.message === "Invalid or missing CSRF token"
          ? "Session security token expired. Please refresh the page."
          : data?.message || "You don't have permission to perform this action.";
      toast.error(msg);
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
