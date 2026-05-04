import api from './axios';

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};

export const clearAll = async () => {
  const response = await api.delete('/notifications');
  return response.data;
};
