const User = require('../models/User');
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const WalletTransaction = require('../models/WalletTransaction');
const Razorpay = require('razorpay');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID || 'test',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

// @desc    Get all users (paginated, filter by role, search by name/email)
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

    // ── Search by name or email (case-insensitive) ────────────────────────────
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      query.$or = [{ name: regex }, { email: regex }];
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

// @desc    Get orders grouped by month (last 6 months)
// @route   GET /api/admin/orders/by-month
// @access  Private (Admin)
const getOrdersByMonth = async (req, res, next) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = result.map((r) => ({
      month: `${monthNames[r._id.month - 1]} ${r._id.year}`,
      count: r.count,
    }));

    res.status(200).json({ success: true, data: formatted });
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
      .populate('student', 'walletBalance name email')
      .populate('client', 'name email');

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (order.status !== 'disputed') {
      return next(new ApiError(400, 'Order is not in disputed status'));
    }

    if (winner === 'student') {
      // Release funds to student wallet
      const studentUser = await User.findByIdAndUpdate(
        order.student._id,
        { $inc: { walletBalance: order.amount } },
        { new: true, select: 'walletBalance' }
      );

      // ── Wallet ledger entry (was missing) ────────────────────────────────────
      await WalletTransaction.create({
        userId: order.student._id,
        type: 'MILESTONE_CREDIT',
        amount: order.amount,
        balanceAfter: studentUser.walletBalance,
        referenceId: order._id,
        status: 'completed',
        note: `Dispute resolved in favour of student for order #${order._id.toString().slice(-8)}`,
      });

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

// @desc    Admin force-update a gig status (pause / restore / delete)
// @route   PATCH /api/admin/gigs/:id/status
// @access  Private (Admin)
const adminUpdateGigStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'paused', 'deleted'].includes(status)) {
      return next(new ApiError(400, 'Status must be active, paused, or deleted'));
    }

    const gig = await Gig.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!gig) return next(new ApiError(404, 'Gig not found'));

    res.status(200).json({ success: true, data: gig });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  banUser,
  getAllOrders,
  getOrdersByMonth,
  getDisputedOrders,
  resolveDispute,
  getPlatformStats,
  adminUpdateGigStatus,
};
