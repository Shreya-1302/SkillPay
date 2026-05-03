import api from './axios';

export const getBalance = async () => {
  const response = await api.get('/wallet/balance');
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get('/wallet/transactions');
  return response.data;
};

export const addUPI = async (upiId) => {
  const response = await api.post('/wallet/add-upi', { upiId });
  return response.data;
};

export const withdraw = async (amount) => {
  const response = await api.post('/wallet/withdraw', { amount });
  return response.data;
};

export const getEarningsByMonth = async () => {
  const response = await api.get('/wallet/earnings-by-month');
  return response.data;
};
