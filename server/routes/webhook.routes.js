const express = require('express');
const crypto = require('crypto');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

const router = express.Router();

// @desc    Razorpay Webhook for Payouts
// @route   POST /api/webhooks/razorpay
// @access  Public
router.post('/razorpay', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== webhookSignature) {
      // In development we might bypass signature check if RAZORPAY_WEBHOOK_SECRET is not perfectly aligned
      if (process.env.NODE_ENV === 'production') {
        console.error('Invalid Razorpay webhook signature');
        return res.status(400).send('Invalid signature');
      }
    }

    const { event, payload } = req.body;

    if (event === 'payout.processed') {
      const payout = payload.payout.entity;
      const transactionId = payout.reference_id;

      if (transactionId) {
        const transaction = await WalletTransaction.findById(transactionId);
        
        if (transaction && transaction.status === 'processing') {
          transaction.status = 'completed';
          transaction.razorpayPayoutId = payout.id;
          await transaction.save();

          // Create Notification
          await Notification.create({
            userId: transaction.userId,
            message: `Your withdrawal of ₹${transaction.amount} has been processed successfully.`,
            type: 'payout_done',
          });

          // Optional: Emit Socket event
          const io = req.app.get('io');
          if (io) {
            io.to(transaction.userId.toString()).emit('notification', {
              type: 'payout_done',
              message: `Your withdrawal of ₹${transaction.amount} has been processed successfully.`,
            });
          }
        }
      }
    }

    if (event === 'payout.failed' || event === 'payout.reversed') {
      const payout = payload.payout.entity;
      const transactionId = payout.reference_id;

      if (transactionId) {
        const transaction = await WalletTransaction.findById(transactionId);
        
        if (transaction && transaction.status === 'processing') {
          transaction.status = 'failed';
          transaction.razorpayPayoutId = payout.id;
          await transaction.save();

          // Revert balance
          const user = await User.findById(transaction.userId);
          if (user) {
            user.walletBalance += transaction.amount;
            await user.save();

            // Create Reversal Transaction
            await WalletTransaction.create({
              userId: user._id,
              amount: transaction.amount,
              type: 'WITHDRAWAL_REVERSAL',
              status: 'completed',
              description: `Withdrawal failed: ${payout.failure_reason || 'Unknown reason'}`,
              balanceAfter: user.walletBalance,
              razorpayPayoutId: payout.id,
            });

            // Create Notification
            await Notification.create({
              userId: user._id,
              message: `Your withdrawal of ₹${transaction.amount} failed. The amount has been refunded to your wallet. Reason: ${payout.failure_reason || 'Unknown'}`,
              type: 'payout_failed',
            });

            // Optional: Emit Socket event
            const io = req.app.get('io');
            if (io) {
              io.to(user._id.toString()).emit('notification', {
                type: 'payout_failed',
                message: `Your withdrawal of ₹${transaction.amount} failed. The amount has been refunded to your wallet.`,
              });
            }
          }
        }
      }
    }

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Webhook Error');
  }
});

module.exports = router;
