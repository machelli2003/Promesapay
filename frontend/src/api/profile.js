import api from "./auth";

export const getProfile = (username) => api.get(`/profile/${username}`);
export const updateProfile = (data) => api.put("/profile/update", data);
export const getMyStats = () => api.get("/profile/stats");