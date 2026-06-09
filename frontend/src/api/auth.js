import client from "./client";

export const registerUser = (data) => client.post("/auth/register", data);
export const loginUser = (data) => client.post("/auth/login", data);
export const getMe = () => client.get("/auth/me");
export const changePassword = (data) => client.put("/auth/change-password", data);
export const getCsrfToken = () => client.get("/auth/csrf-token");

/** Sync CSRF token from session cookie into localStorage for mutating requests. */
export const refreshCsrfToken = async () => {
  const res = await getCsrfToken();
  if (res.data?.csrf_token) {
    localStorage.setItem("csrf_token", res.data.csrf_token);
  }
  return res.data?.csrf_token;
};
export const getOAuthToken = () => client.post("/auth/get-oauth-token");

export const googleLogin = () => {
  window.location.href = "/api/auth/google/login";
};
