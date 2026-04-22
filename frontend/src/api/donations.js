import api from "./auth";

export const initiateDonation = (data) => api.post("/donations/initiate", data);
export const verifyDonation = (reference) => api.post("/donations/verify", { reference });