import api from './axios';

// Create a new milestone (student only)
export const createMilestone = async ({ orderId, title, description, amount }) => {
  const { data } = await api.post('/milestones', { orderId, title, description, amount });
  return data.data;
};

// Submit deliverable for a milestone (student only)
// Pass a FormData object containing optionally `deliverable` file + `deliverableNote`
export const submitMilestone = async (milestoneId, formData) => {
  const { data } = await api.post(`/milestones/${milestoneId}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

// Approve a milestone (client only)
export const approveMilestone = async (milestoneId) => {
  const { data } = await api.patch(`/milestones/${milestoneId}/approve`);
  return data.data;
};

// Request revision (client only)
export const requestRevision = async (milestoneId, revisionNote) => {
  const { data } = await api.patch(`/milestones/${milestoneId}/revision`, { revisionNote });
  return data.data;
};

// Get all milestones for an order
export const getMilestonesByOrder = async (orderId) => {
  const { data } = await api.get(`/milestones/order/${orderId}`);
  return data; // { data: [], summary: {} }
};
