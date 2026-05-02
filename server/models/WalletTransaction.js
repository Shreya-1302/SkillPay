const mongoose = require('mongoose');

/**
 * APPEND-ONLY LEDGER — never update a document, always insert new ones.
 * This gives a complete audit trail for every balance change.
 */
const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'MILESTONE_CREDIT',    // Student earns from approved milestone (after 8% fee)
        'WITHDRAWAL_DEBIT',    // Student initiates payout
        'WITHDRAWAL_REVERSAL', // Payout failed — amount returned to wallet
        'DISPUTE_HOLD',        // Funds frozen during dispute
        'DISPUTE_RELEASE',     // Funds released after dispute resolution
      ],
      required: true,
    },
    // The amount involved in this transaction (positive = credit, negative = debit)
    amount: {
      type: Number,
      required: true,
    },
    // Wallet balance AFTER this transaction was applied
    balanceAfter: {
      type: Number,
      required: true,
    },
    // Polymorphic reference: milestoneId, withdrawalId, disputeId, etc.
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // Razorpay payout ID (populated for WITHDRAWAL_DEBIT / WITHDRAWAL_REVERSAL)
    razorpayPayoutId: {
      type: String,
      default: null,
    },
    // pending → completed (payout processed) | failed (payout failed)
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
    // Explicit timestamp field for clarity (createdAt from timestamps also exists)
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Disable the auto-generated updatedAt to reinforce append-only intent
    timestamps: { createdAt: false, updatedAt: false },
  }
);

// Guard against accidental updates at the schema level
walletTransactionSchema.pre('findOneAndUpdate', function () {
  throw new Error('WalletTransaction is append-only. Use .create() instead of .update().');
});
walletTransactionSchema.pre('updateOne', function () {
  throw new Error('WalletTransaction is append-only. Use .create() instead of .update().');
});
walletTransactionSchema.pre('updateMany', function () {
  throw new Error('WalletTransaction is append-only. Use .create() instead of .update().');
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
