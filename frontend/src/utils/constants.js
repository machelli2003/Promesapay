const defaultOrigin = (() => {
  if (typeof window === "undefined") {
    return "https://promesapay.onrender.com";
  }
  const host = window.location.host;
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return window.location.origin;
  }
  return "https://promesapay.onrender.com";
})();

export const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || defaultOrigin;
export const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";
export const DOLL_PRICE = 5;
export const DOLL_OPTIONS = [1, 3, 5];
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;