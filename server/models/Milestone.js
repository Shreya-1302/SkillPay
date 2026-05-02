const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Milestone amount is required'],
      min: [1, 'Amount must be at least ₹1'],
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'revision_requested', 'approved'],
      default: 'pending',
    },
    // Cloudinary URL of the work deliverable uploaded by student
    deliverableUrl: {
      type: String,
      default: null,
    },
    // Optional note from student when submitting
    deliverableNote: {
      type: String,
      trim: true,
      default: null,
    },
    // Note from client when requesting revision
    revisionNote: {
      type: String,
      trim: true,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Milestone', milestoneSchema);
