const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Gig = require('../models/Gig');
const ApiError = require('../utils/ApiError');

// Initialize Razorpay (lazily so missing keys don't crash server start)
const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// @desc  Create a Razorpay order and a pending DB order
// @route POST /api/orders
// @access Private
const createOrder = async (req, res, next) => {
  try {
    const { gigId, requirements } = req.body;

    const gig = await Gig.findById(gigId);
    if (!gig || gig.status !== 'active') {
      return next(new ApiError(404, 'Gig not found or not active'));
    }

    // Amount in paise (Razorpay expects smallest currency unit)
    const amountInPaise = gig.basePrice * 100;

    // Create Razorpay order (mock if using placeholder key)
    let razorpayOrder;
    const isMockKey = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder');
    
    if (isMockKey) {
      razorpayOrder = {
        id: `mock_order_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      };
    } else {
      const razorpay = getRazorpay();
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
      });
    }

    // Save pending order in DB
    const order = await Order.create({
      gig: gig._id,
      client: req.user.id,
      student: gig.studentId,
      requirements,
      amount: gig.basePrice,
      status: 'payment_pending',
      razorpayOrderId: razorpayOrder.id,
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Verify Razorpay payment signature and activate order
// @route POST /api/orders/verify-payment
// @access Private
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature (mock if using placeholder)
    const isMockKey = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder');
    
    if (!isMockKey) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSig !== razorpay_signature) {
        return next(new ApiError(400, 'Invalid payment signature'));
      }
    } else {
      if (razorpay_signature !== 'mock_signature') {
        return next(new ApiError(400, 'Invalid mock payment signature'));
      }
    }

    // Update order status
    const order = await Order.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: 'in_escrow',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    ).populate('gig', 'title').populate('student', 'name email');

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    res.status(200).json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all orders for logged in client
// @route GET /api/orders/client/my-orders
// @access Private
const getMyOrdersClient = async (req, res, next) => {
  try {
    const orders = await Order.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .populate('gig', 'title basePrice')
      .populate('student', 'name email avatar');

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc  Get all orders for logged in student
// @route GET /api/orders/student/my-orders
// @access Private
const getMyOrdersStudent = async (req, res, next) => {
  try {
    const orders = await Order.find({ student: req.user.id })
      .sort({ createdAt: -1 })
      .populate('gig', 'title basePrice')
      .populate('client', 'name email avatar');

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single order by ID
// @route GET /api/orders/:id
// @access Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('gig', 'title basePrice deliveryDays')
      .populate('client', 'name email avatar')
      .populate('student', 'name email avatar');

    if (!order) {
      return next(new ApiError(404, 'Order not found'));
    }

    // Only allow client or student of this order to view it
    const userId = req.user.id;
    if (order.client._id.toString() !== userId && order.student._id.toString() !== userId) {
      return next(new ApiError(403, 'Not authorized to view this order'));
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, verifyPayment, getMyOrdersClient, getMyOrdersStudent, getOrderById };
