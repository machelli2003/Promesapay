import client from "./client";

export const getProfile = (username) => client.get(`/profile/${username}`);
export const updateProfile = (data) => client.put("/profile/update", data);
export const getMyStats = () => client.get("/profile/stats");