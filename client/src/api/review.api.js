import api from './axios';

export const createReview = async (orderId, { rating, comment }) => {
  const response = await api.post('/reviews', { orderId, rating, comment });
  return response.data;
};

export const getReviewsByGig = async (gigId) => {
  const response = await api.get(`/reviews/gig/${gigId}`);
  return response.data;
};
