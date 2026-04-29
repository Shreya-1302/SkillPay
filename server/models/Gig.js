const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Programming & Tech', 'Graphics & Design', 'Digital Marketing', 'Writing & Translation', 'Video & Animation', 'Music & Audio', 'Business', 'Other'] // You can adjust these categories
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryDays: {
    type: Number,
    required: true,
    min: 1
  },
  tags: {
    type: [String],
    default: []
  },
  portfolioImages: {
    type: [String], // URLs of Cloudinary images
    default: [],
    validate: [arrayLimit, '{PATH} exceeds the limit of 5']
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'deleted'],
    default: 'active'
  },
  avgRating: {
    type: Number,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

function arrayLimit(val) {
  return val.length <= 5;
}

// Text index for search functionality
gigSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Gig', gigSchema);
