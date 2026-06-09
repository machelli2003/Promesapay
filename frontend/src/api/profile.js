import client from "./client";

export const getProfile = (username) => client.get(`/profile/${username}`);
export const updateProfile = (data) => client.put("/profile/me", data);
export const getMyStats = () => client.get("/profile/me/stats");