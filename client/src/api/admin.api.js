import api from './axios';

export const getPlatformStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data.data;
};

export const getAllUsers = async ({ role, search, page = 1 } = {}) => {
  const params = new URLSearchParams();
  if (role) params.append('role', role);
  if (search) params.append('search', search);
  params.append('page', page);
  params.append('limit', 20);
  const response = await api.get(`/admin/users?${params.toString()}`);
  return response.data;
};

export const banUser = async (id, isBanned) => {
  const response = await api.patch(`/admin/users/${id}/ban`, { isBanned });
  return response.data;
};

export const getDisputedOrders = async () => {
  const response = await api.get('/admin/orders/disputes');
  return response.data.data;
};

export const resolveDispute = async (id, winner) => {
  const response = await api.patch(`/admin/orders/${id}/resolve`, { winner });
  return response.data;
};

// Now backed by a real aggregation endpoint instead of client-side bucketing
export const getOrdersByMonth = async () => {
  const response = await api.get('/admin/orders/by-month');
  return response.data.data;
};

export const updateGigStatus = async (id, status) => {
  const response = await api.patch(`/admin/gigs/${id}/status`, { status });
  return response.data;
};
