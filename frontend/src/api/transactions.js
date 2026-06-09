import client from "./client";

export const getTransactions = (page = 1, limit = 20) =>
  client.get(`/transactions/?page=${page}&limit=${limit}`);

export const transactionsAPI = {
  getTransactions: (page = 1, limit = 20) =>
    client.get(`/transactions/?page=${page}&limit=${limit}`),
  getUserTransactions: (page = 1, limit = 20) =>
    client.get(`/transactions/?page=${page}&limit=${limit}`),
};