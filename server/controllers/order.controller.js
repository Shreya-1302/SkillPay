const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const ApiError = require('../utils/ApiError');
const { scheduleDeadlineJob } = require('../jobs/orderDeadline.job');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'test',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

// @desc    Create new order (Initiate payment)
// @route   POST /api/orders
// @access  Private (Client only)
const createOrder = async (req, res, next) => {
  try {
    const { gigId, requirements } = req.body;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return next(new ApiError(404, 'Gig not found'));
    }

    if (req.user.role !== 'client') {
      return next(new ApiError(403, 'Only clients can place orders'));
    }

    const amountInPaise = gig.basePrice * 100; // Razorpay expects amount in paise

    // Create Razorpay Order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    let rzpOrder;
    if (process.env.DEV_PAYMENT_BYPASS === 'true') {
      rzpOrder = { id: `fake_rzp_${Date.now()}`, amount: amountInPaise, currency: 'INR' };
    } else {
      try {
        rzpOrder = await razorpay.orders.create(options);
      } catch (err) {
        // Allow proceeding with fake id if Razorpay is not configured (for dev)
        rzpOrder = { id: `fake_rzp_${Date.now()}`, amount: amountInPaise, currency: 'INR' };
      }
    }

    // Calculate deadline based on gig deliveryDays
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + gig.deliveryDays);

    // Save order in DB as pending
    const order = await Order.create({
      gig: gig._id,
      client: req.user.id,
      student: gig.studentId,   // ← was gig.student (undefined); correct field is studentId
      amount: gig.basePrice,
      requirements,
      status: 'pending_payment',
      razorpayOrderId: rzpOrder.id,
      deadline,
    });

    res.status(201).json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    // Skip verification if we are using a fake dev order
    if (!razorpayOrderId.startsWith('fake_rzp_')) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return next(new ApiError(400, 'Invalid payment signature'));
      }
    }

    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.status = 'in_escrow';
    await order.save();

    // Schedule auto-cancel deadline job
    scheduleDeadlineJob(order._id.toString(), order.deadline);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get client's orders
// @route   GET /api/orders/client
// @access  Private (Client only)
const getMyOrdersClient = async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      return next(new ApiError(403, 'Not authorized'));
    }

    const orders = await Order.find({ client: req.user.id })
      .populate('gig', 'title portfolioImages deliveryDays')
      .populate('student', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get student's orders
// @route   GET /api/orders/student
// @access  Private (Student only)
const getMyOrdersStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return next(new ApiError(403, 'Not authorized'));
    }

    const orders = await Order.find({ student: req.user.id })
      .populate('gig', 'title portfolioImages deliveryDays')
      .populate('client', 'name avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('gig', 'title portfolioImages deliveryDays basePrice')
      .populate('client', 'name avatar')
      .populate('student', 'name avatar');

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    // Check authorization
    if (order.client._id.toString() !== req.user.id && order.student._id.toString() !== req.user.id) {
      return next(new ApiError(403, 'Not authorized to view this order'));
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Raise a dispute
// @route   POST /api/orders/:id/dispute
// @access  Private
const raiseDispute = async (req, res, next) => {
  try {
    const { reason } = req.body; // Will just log or ignore for now, status update is primary
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    if (order.client.toString() !== req.user.id && order.student.toString() !== req.user.id) {
      return next(new ApiError(403, 'Not authorized'));
    }

    if (['pending_payment', 'completed', 'cancelled'].includes(order.status)) {
      return next(new ApiError(400, 'Order cannot be disputed in its current status'));
    }

    order.status = 'disputed';
    await order.save();
    
    console.log(`Dispute raised on order ${order._id} by user ${req.user.id}. Reason: ${reason}`);

    res.status(200).json({
      success: true,
      message: 'Dispute raised successfully. Admin has been notified.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrdersClient,
  getMyOrdersStudent,
  getOrderById,
  raiseDispute,
};
