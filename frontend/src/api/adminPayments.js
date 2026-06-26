import client from './client';

// Payment Method Approval Management
export const getPendingPaymentMethods = (params = {}) => 
  client.get('/admin/payments/methods/pending', { params });

export const getAllPaymentMethods = (params = {}) => 
  client.get('/admin/payments/methods', { params });

export const approvePaymentMethod = (methodId, data) => 
  client.post(`/admin/payments/methods/${methodId}/approve`, data);

export const rejectPaymentMethod = (methodId, data) => 
  client.post(`/admin/payments/methods/${methodId}/reject`, data);

// Withdrawal Management
export const getPendingWithdrawals = (params = {}) => 
  client.get('/admin/payments/withdrawals/pending', { params });

export const getAllWithdrawals = (params = {}) => 
  client.get('/admin/payments/withdrawals', { params });

export const approveWithdrawal = (withdrawalId, data) => 
  client.post(`/admin/payments/withdrawals/${withdrawalId}/approve`, data);

export const rejectWithdrawal = (withdrawalId, data) => 
  client.post(`/admin/payments/withdrawals/${withdrawalId}/reject`, data);

export const completeWithdrawal = (withdrawalId, data) => 
  client.post(`/admin/payments/withdrawals/${withdrawalId}/complete`, data);

// Fund Allocation
export const allocateFundsToUser = (data) => 
  client.post('/admin/payments/allocate-funds', data);

export const getFundAllocations = (params = {}) => 
  client.get('/admin/payments/allocations', { params });

// Financial Overview
export const getFinancialOverview = () => 
  client.get('/admin/payments/financial-overview');
