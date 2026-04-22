import api from "./auth";

export const getTransactions = (page = 1, limit = 20) =>
  api.get(`/transactions/?page=${page}&limit=${limit}`);