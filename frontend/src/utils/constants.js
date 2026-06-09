export const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "https://promesapay.onrender.com";
export const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";
export const COFFEE_PRICE = 5;
export const COFFEE_OPTIONS = [1, 3, 5];
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;