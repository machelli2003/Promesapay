import client from "./client";

export const getAdminPayoutStats = () => client.get("/admin/payouts/stats");

export const getAdminPayouts = (params = {}) =>
  client.get("/admin/payouts", { params });

export const getAdminPayoutDetail = (payoutId) =>
  client.get(`/admin/payouts/${payoutId}`);

export const updateAdminPayoutStatus = (payoutId, data) =>
  client.patch(`/admin/payouts/${payoutId}/status`, data);
