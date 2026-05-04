import api from './axios';

export const createOrder = async (gigId, requirements) => {
  const response = await api.post('/orders', { gigId, requirements });
  return response.data;
};

export const verifyPayment = async (data) => {
  const response = await api.post('/orders/verify', data);
  return response.data;
};

export const getMyOrdersClient = async () => {
  const response = await api.get('/orders/client');
  return response.data.data;
};

export const getMyOrdersStudent = async () => {
  const response = await api.get('/orders/student');
  return response.data.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data.data;
};

export const raiseDispute = async (id, reason) => {
  const response = await api.post(`/orders/${id}/dispute`, { reason });
  return response.data;
};
