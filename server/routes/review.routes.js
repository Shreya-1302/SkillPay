const express = require('express');
const { createReview, getGigReviews } = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/gig/:gigId', getGigReviews);

router.post('/', protect, authorize('client'), createReview);

module.exports = router;
