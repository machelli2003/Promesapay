import client from './client';

export const getPaymentMethods = () => client.get('/payment-methods');
export const addPaymentMethod = (data) => client.post('/payment-methods', data);
export const getPaymentMethod = (methodId) => client.get(`/payment-methods/${methodId}`);
export const updatePaymentMethod = (methodId, data) => client.put(`/payment-methods/${methodId}`, data);
export const deletePaymentMethod = (methodId) => client.delete(`/payment-methods/${methodId}`);
export const verifyPaymentMethod = (methodId) => client.post(`/payment-methods/${methodId}/verify`);
