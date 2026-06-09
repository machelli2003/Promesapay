import client from "./client";

export const getCategories = () => client.get("/campaigns/categories");

export const listCampaigns = (params = {}) =>
  client.get("/campaigns/", { params });

export const getMyCampaigns = () => client.get("/campaigns/me");

export const getCampaign = (slug) => client.get(`/campaigns/${slug}`);

export const createCampaign = (data) => client.post("/campaigns/", data);

export const updateCampaign = (slug, data) => client.put(`/campaigns/${slug}`, data);

export const getCampaignUpdates = (slug) => client.get(`/campaigns/${slug}/updates`);

export const postCampaignUpdate = (slug, data) =>
  client.post(`/campaigns/${slug}/updates`, data);

export const getCampaignComments = (slug) => client.get(`/campaigns/${slug}/comments`);

export const postCampaignComment = (slug, data) =>
  client.post(`/campaigns/${slug}/comments`, data);
