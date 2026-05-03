const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending_payment', 'in_escrow', 'in_progress', 'completed', 'cancelled'],
    default: 'pending_payment',
  },
  razorpayOrderId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
