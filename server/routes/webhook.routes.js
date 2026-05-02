const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const Order = require('../models/Order');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const sendEmail = require('../utils/sendEmail');

// ─── Raw body needed for signature verification ───────────────────────────────
// NOTE: This route must be mounted BEFORE express.json() in server.js,
// OR the route itself uses express.raw(). We handle it here explicitly.
router.use(express.raw({ type: 'application/json' }));

// ─── Razorpay webhook signature verifier ─────────────────────────────────────
const verifyWebhookSignature = (rawBody, signature, secret) => {
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return expectedSig === signature;
};

// ─────────────────────────────────────────────────────────────────────────────
// @route POST /api/webhooks/razorpay
// @desc  Handle all Razorpay webhook events
// @access Public (secured by HMAC signature)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = req.body; // Buffer from express.raw()

  // ── Skip signature check in dev/test mode ─────────────────────────────────
  const isMockKey =
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID.includes('placeholder');

  if (!isMockKey && webhookSecret) {
    if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn('⚠️  Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const eventType = event.event;
  console.log(`📩 Razorpay webhook received: ${eventType}`);

  try {
    // ── payment.captured ────────────────────────────────────────────────────
    if (eventType === 'payment.captured') {
      const payment = event.payload.payment.entity;
      await Order.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          status: 'in_escrow',
          razorpayPaymentId: payment.id,
        }
      );
    }

    // ── payout.processed (withdrawal successful) ─────────────────────────────
    else if (eventType === 'payout.processed') {
      const payout = event.payload.payout.entity;
      const razorpayPayoutId = payout.id;

      // Find the pending WITHDRAWAL_DEBIT transaction for this payout
      const txn = await WalletTransaction.findOne({
        razorpayPayoutId,
        type: 'WITHDRAWAL_DEBIT',
        status: 'pending',
      });

      if (txn) {
        // Append a new "completed" record instead of mutating the pending one
        await WalletTransaction.create({
          userId: txn.userId,
          type: 'WITHDRAWAL_DEBIT',
          amount: txn.amount,
          balanceAfter: txn.balanceAfter, // balance already deducted at request time
          referenceId: txn.referenceId,
          razorpayPayoutId,
          status: 'completed',
          note: `Payout of ₹${Math.abs(txn.amount)} processed successfully (ref: ${razorpayPayoutId})`,
        });

        // Optionally email the student
        const user = await User.findById(txn.userId).select('name email');
        if (user?.email) {
          await sendEmail(
            user.email,
            '✅ Your SkillPay withdrawal was processed',
            `
              <h2>Withdrawal Successful</h2>
              <p>Hi ${user.name}, your withdrawal of <strong>₹${Math.abs(txn.amount)}</strong> has been processed and sent to your bank account.</p>
              <p>Razorpay Payout ID: <code>${razorpayPayoutId}</code></p>
              <p>Funds typically arrive within 24 hours.</p>
            `
          );
        }
      }
    }

    // ── payout.failed (withdrawal failed — reverse the debit) ────────────────
    else if (eventType === 'payout.failed') {
      const payout = event.payload.payout.entity;
      const razorpayPayoutId = payout.id;
      const failureReason = payout.failure_reason || 'Unknown reason';

      // Find the pending WITHDRAWAL_DEBIT transaction
      const txn = await WalletTransaction.findOne({
        razorpayPayoutId,
        type: 'WITHDRAWAL_DEBIT',
        status: 'pending',
      });

      if (txn) {
        const refundAmount = Math.abs(txn.amount); // amount is stored as negative for debits

        // Return funds to wallet atomically
        const updatedUser = await User.findByIdAndUpdate(
          txn.userId,
          { $inc: { walletBalance: refundAmount } },
          { new: true, select: 'walletBalance name email' }
        );

        // Append-only reversal record
        await WalletTransaction.create({
          userId: txn.userId,
          type: 'WITHDRAWAL_REVERSAL',
          amount: refundAmount,
          balanceAfter: updatedUser.walletBalance,
          referenceId: txn.referenceId,
          razorpayPayoutId,
          status: 'completed',
          note: `Payout failed (${failureReason}). ₹${refundAmount} returned to wallet.`,
        });

        // Append a failed status record for the original debit
        await WalletTransaction.create({
          userId: txn.userId,
          type: 'WITHDRAWAL_DEBIT',
          amount: txn.amount,
          balanceAfter: txn.balanceAfter,
          referenceId: txn.referenceId,
          razorpayPayoutId,
          status: 'failed',
          note: `Payout failed: ${failureReason}`,
        });

        // Email student about failure + reversal
        if (updatedUser?.email) {
          await sendEmail(
            updatedUser.email,
            '❌ SkillPay Withdrawal Failed — Amount Reversed',
            `
              <h2>Withdrawal Failed</h2>
              <p>Hi ${updatedUser.name}, unfortunately your withdrawal of <strong>₹${refundAmount}</strong> could not be processed.</p>
              <p><strong>Reason:</strong> ${failureReason}</p>
              <p>The amount has been <strong>returned to your SkillPay wallet</strong>. Your new balance is ₹${updatedUser.walletBalance}.</p>
              <p>Please verify your bank account details and try again.</p>
            `
          );
        }
      }
    }

    // ── All other events — acknowledge and ignore ────────────────────────────
    else {
      console.log(`ℹ️  Unhandled webhook event type: ${eventType}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Always return 200 to Razorpay to prevent retries for application errors
    return res.status(200).json({ received: true, warning: 'Internal processing error, check logs' });
  }
});

module.exports = router;
