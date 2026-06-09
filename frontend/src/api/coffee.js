import client from "./client";

/**
 * Initiate a coffee purchase
 */
export const initiateCoffee = (data) => client.post("/coffee/initiate", data);

/**
 * Verify coffee payment
 */
export const verifyCoffee = (reference) => client.post("/coffee/verify", { reference });

/**
 * Get recent coffees received by user
 */
export const getRecentCoffees = (page = 1) => client.get(`/coffee/recent?page=${page}`);

/** Alias used by financial/refund flows */
export const getCoffees = getRecentCoffees;

/**
 * Get coffee statistics for user
 */
export const getCoffeeStats = () => client.get("/coffee/stats");