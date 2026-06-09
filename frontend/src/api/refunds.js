import client from './client';

export const getRefunds = (params = {}) => client.get('/refunds', { params });
export const requestRefund = (data) => client.post('/refunds/request', data);
export const getRefundDetails = (refundId) => client.get(`/refunds/${refundId}`);
