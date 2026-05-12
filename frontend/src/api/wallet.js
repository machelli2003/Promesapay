import client from './client';

export const getWalletBalance = () => client.get('/wallet/balance');
export const getWalletTransactions = (params = {}) => client.get('/wallet/transactions', { params });
export const requestWithdrawal = (data) => client.post('/wallet/withdraw', data);