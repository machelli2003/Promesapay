import client from "./client";
import { API_ORIGIN } from "../utils/constants";

export const registerUser = (data) => client.post("/auth/register", data);
export const loginUser = (data) => client.post("/auth/login", data);
export const getMe = () => client.get("/auth/me");
export const changePassword = (data) => client.put("/auth/change-password", data);
export const getOAuthToken = () => client.post("/auth/get-oauth-token");

export const googleLogin = () => {
  window.location.href = API_ORIGIN ? `${API_ORIGIN}/api/auth/google/login` : "/api/auth/google/login";
};
