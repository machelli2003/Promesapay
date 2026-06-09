import client from './client';

// Payouts
export const getPayouts = (params = {}) => client.get('/payouts', { params });
export const initiatePayouts = (data) => client.post('/payouts/initiate', data);
export const getPayoutDetails = (payoutId) => client.get(`/payouts/${payoutId}`);
export const cancelPayout = (payoutId) => client.post(`/payouts/${payoutId}/cancel`);
export const getPayoutStats = () => client.get('/payouts/stats');

// Payment Methods
export const getPaymentMethods = () => client.get('/payment-methods');
export const addPaymentMethod = (data) => client.post('/payment-methods', data);
export const getPaymentMethod = (methodId) => client.get(`/payment-methods/${methodId}`);
export const updatePaymentMethod = (methodId, data) => client.put(`/payment-methods/${methodId}`, data);
export const deletePaymentMethod = (methodId) => client.delete(`/payment-methods/${methodId}`);
export const verifyPaymentMethod = (methodId) => client.post(`/payment-methods/${methodId}/verify`);

// Refunds
export const getRefunds = (params = {}) => client.get('/refunds', { params });
export const requestRefund = (data) => client.post('/refunds/request', data);
export const getRefundDetails = (refundId) => client.get(`/refunds/${refundId}`);

// Receipts
export const getReceipts = (params = {}) => client.get('/receipts', { params });
export const getReceiptDetails = (receiptId) => client.get(`/receipts/${receiptId}`);
export const getReceiptForTransaction = (transactionId) => client.get(`/receipts/transaction/${transactionId}`);
export const resendReceipt = (receiptId) => client.post(`/receipts/${receiptId}/resend`);
export const downloadReceiptPDF = (receiptId) => client.get(`/receipts/${receiptId}/download`);
