import client from './client';

export const getReceipts = (params = {}) => client.get('/receipts', { params });
export const getReceiptDetails = (receiptId) => client.get(`/receipts/${receiptId}`);
export const getReceiptForTransaction = (transactionId) => client.get(`/receipts/transaction/${transactionId}`);
export const resendReceipt = (receiptId) => client.post(`/receipts/${receiptId}/resend`);
export const downloadReceiptPDF = (receiptId) => client.get(`/receipts/${receiptId}/download`);
