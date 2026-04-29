import api from './axios';

export const getGigs = async (params) => {
  const { data } = await api.get('/gigs', { params });
  return {
    gigs: data.data,
    totalGigs: data.pagination?.total || 0,
    totalPages: data.pagination?.pages || 0
  };
};

export const getGigById = async (id) => {
  const { data } = await api.get(`/gigs/${id}`);
  return data.data;
};

export const createGig = async (formData) => {
  const { data } = await api.post('/gigs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const updateGig = async (id, formData) => {
  const { data } = await api.put(`/gigs/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deleteGig = async (id) => {
  const { data } = await api.delete(`/gigs/${id}`);
  return data;
};

export const getMyGigs = async () => {
  const { data } = await api.get('/gigs/my/list');
  return data.data;
};
