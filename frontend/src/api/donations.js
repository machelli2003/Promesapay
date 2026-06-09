import client from "./client";

export const initiateDonation = (data) => client.post("/donations/initiate", data);
export const verifyDonation = (reference) => client.post("/donations/verify", { reference });

/** Donations received by the authenticated user (via transactions API). */
export const getDonations = async (page = 1, limit = 100) => {
  const res = await client.get(`/transactions/?page=${page}&limit=${limit}&type=donation`);
  return {
    ...res,
    data: { donations: res.data?.transactions ?? [] },
  };
};