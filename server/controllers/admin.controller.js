const User = require('../models/User');
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const Razorpay = require('razorpay');
const ApiError = require('../utils/ApiError');

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || 'test',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

// @desc    Get all users (paginated, filter by role)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .skip(startIndex)
      .limit(limit)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Ban or Unban a user
// @route   PATCH /api/admin/users/:id/ban
// @access  Private (Admin)
const banUser = async (req, res, next) => {
  try {
    const { isBanned } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    if (user.role === 'admin') {
      return next(new ApiError(400, 'Cannot ban an admin user'));
    }

    user.isBanned = isBanned !== undefined ? isBanned : true;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (filter by status/date)
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    let query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // date filtering (optional)
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('client', 'name email')
      .populate('student', 'name email')
      .populate('gig', 'title')
      .skip(startIndex)
      .limit(limit)
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all disputed orders
// @route   GET /api/admin/orders/disputes
// @access  Private (Admin)
const getDisputedOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ status: 'disputed' })
      .populate('client', 'name email')
      .populate('student', 'name email')
      .populate('gig', 'title')
      .sort('-updatedAt');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve a dispute
// @route   PATCH /api/admin/orders/:id/resolve
// @access  Private (Admin)
const resolveDispute = async (req, res, next) => {
  try {
    const { winner } = req.body; // 'student' or 'client'
    const order = await Order.findById(req.params.id)
      .populate('student', 'walletBalance')
      .populate('client', 'name email');

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (order.status !== 'disputed') {
      return next(new ApiError(400, 'Order is not in disputed status'));
    }

    if (winner === 'student') {
      // Release funds to student wallet
      const studentUser = await User.findById(order.student._id);
      studentUser.walletBalance += order.amount;
      await studentUser.save();
      
      order.status = 'completed';
    } else if (winner === 'client') {
      // Refund to client via Razorpay
      if (order.razorpayPaymentId) {
        try {
          await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: order.amount * 100, // in paise
          });
        } catch (rzpErr) {
          console.error('Razorpay Refund Error:', rzpErr);
          // If fake ID, just bypass it for dev
          if (!order.razorpayPaymentId.startsWith('fake_')) {
            return next(new ApiError(500, 'Failed to process Razorpay refund'));
          }
        }
      }
      
      order.status = 'cancelled';
    } else {
      return next(new ApiError(400, 'Invalid winner specified'));
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Dispute resolved in favor of ${winner}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get platform stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGigs = await Gig.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Calculate total revenue (assuming platform fee is 0 for now, or total money processed)
    const revenueAgg = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalGigs,
        totalOrders,
        totalRevenue,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  banUser,
  getAllOrders,
  getDisputedOrders,
  resolveDispute,
  getPlatformStats,
};
