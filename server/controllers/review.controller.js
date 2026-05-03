const Review = require('../models/Review');
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Client only)
const createReview = async (req, res, next) => {
  try {
    const { orderId, gigId, rating, comment } = req.body;

    // Check if order exists and belongs to client
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }
    
    if (order.client.toString() !== req.user.id.toString()) {
      return next(new ApiError(403, 'Not authorized to review this order'));
    }

    if (order.status !== 'completed') {
      return next(new ApiError(400, 'You can only review completed orders'));
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      return next(new ApiError(400, 'You have already reviewed this order'));
    }

    // Create review
    const review = await Review.create({
      orderId,
      gigId,
      clientId: req.user.id,
      rating: Number(rating),
      comment,
    });

    // Update Gig average rating using aggregation
    const stats = await Review.aggregate([
      { $match: { gigId: review.gigId } },
      {
        $group: {
          _id: '$gigId',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      await Gig.findByIdAndUpdate(gigId, {
        avgRating: Math.round(stats[0].avgRating * 10) / 10,
        totalReviews: stats[0].totalReviews,
      });
    }

    // Increment student totalReviews
    await User.findByIdAndUpdate(order.student, {
      $inc: { totalReviews: 1 },
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(400, 'You have already reviewed this order'));
    }
    next(error);
  }
};

// @desc    Get gig reviews
// @route   GET /api/reviews/gig/:gigId
// @access  Public
const getGigReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ gigId: req.params.gigId })
      .populate('clientId', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getGigReviews,
};
