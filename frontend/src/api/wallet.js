import client from './client';

export const getWalletBalance = () => client.get('/wallet/balance');
export const getWalletTransactions = (params = {}) => client.get('/wallet/transactions', { params });
export const getFinancialSummary = () => client.get('/wallet/summary');
export const requestWithdrawal = (data) => client.post('/wallet/withdraw', data);

// Withdrawal endpoints
export const getWithdrawals = (params = {}) => client.get('/withdrawals', { params });
export const getWithdrawalDetail = (withdrawalId) => client.get(`/withdrawals/${withdrawalId}`);
export const cancelWithdrawal = (withdrawalId) => client.post(`/withdrawals/${withdrawalId}/cancel`);