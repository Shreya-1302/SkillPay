import api from './axios';

export const createOrder = async (gigId, requirements) => {
  const { data } = await api.post('/orders', { gigId, requirements });
  return data.data;
};

export const verifyPayment = async (verificationData) => {
  const { data } = await api.post('/orders/verify-payment', verificationData);
  return data.data;
};

export const getMyOrdersClient = async () => {
  const { data } = await api.get('/orders/client/my-orders');
  return data.data;
};

export const getMyOrdersStudent = async () => {
  const { data } = await api.get('/orders/student/my-orders');
  return data.data;
};

export const getOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data.data;
};
