import client from "./client";

export const initiateDonation = (data) => client.post("/donations/initiate", data);
export const verifyDonation = (reference) => client.post("/donations/verify", { reference });