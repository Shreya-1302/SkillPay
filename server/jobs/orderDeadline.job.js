const Bull = require('bull');
const Order = require('../models/Order');
const User = require('../models/User');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');

/* ── Razorpay client ── */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ── Nodemailer transporter ── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendMail = (to, subject, html) =>
  transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, html });

/* ── Bull Queue ──
   Requires Redis. REDIS_URL defaults to local instance.
   If Redis is unavailable the queue gracefully logs a warning instead of crashing.
─────────────────────────────────────────── */
let orderDeadlineQueue;

try {
  orderDeadlineQueue = new Bull('orderDeadline', {
    redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  });

  /* ── Job processor ── */
  orderDeadlineQueue.process(async (job) => {
    const { orderId } = job.data;
    console.log(`[orderDeadline] Processing job for order ${orderId}`);

    const order = await Order.findById(orderId)
      .populate('client', 'name email')
      .populate('student', 'name email');

    if (!order) {
      console.log(`[orderDeadline] Order ${orderId} not found, skipping.`);
      return;
    }

    // Only act if still in_progress (not already completed / cancelled / disputed)
    if (order.status !== 'in_progress') {
      console.log(`[orderDeadline] Order ${orderId} status is ${order.status}, skipping.`);
      return;
    }

    // Mark as cancelled
    order.status = 'cancelled';
    await order.save();

    console.log(`[orderDeadline] Order ${orderId} cancelled due to missed deadline.`);

    // Attempt Razorpay refund
    if (order.razorpayPaymentId && !order.razorpayPaymentId.startsWith('fake_')) {
      try {
        await razorpay.payments.refund(order.razorpayPaymentId, {
          amount: order.amount * 100, // paise
        });
        console.log(`[orderDeadline] Refund issued for order ${orderId}`);
      } catch (err) {
        console.error(`[orderDeadline] Razorpay refund failed for order ${orderId}:`, err.message);
      }
    }

    // Email client
    if (order.client?.email) {
      await sendMail(
        order.client.email,
        'SkillPay – Order Deadline Missed & Refund Issued',
        `<p>Hi ${order.client.name},</p>
         <p>Order <strong>#${orderId.substring(0, 8)}</strong> has been automatically cancelled because the delivery deadline was missed.</p>
         <p>A refund of <strong>₹${order.amount}</strong> has been initiated to your original payment method.</p>
         <p>We apologise for the inconvenience.</p>
         <p>— SkillPay Team</p>`
      ).catch(console.error);
    }

    // Email student
    if (order.student?.email) {
      await sendMail(
        order.student.email,
        'SkillPay – Order Cancelled Due to Missed Deadline',
        `<p>Hi ${order.student.name},</p>
         <p>Order <strong>#${orderId.substring(0, 8)}</strong> has been automatically cancelled because the delivery deadline was missed.</p>
         <p>The client has been refunded. Please ensure timely delivery on future orders.</p>
         <p>— SkillPay Team</p>`
      ).catch(console.error);
    }
  });

  orderDeadlineQueue.on('failed', (job, err) => {
    console.error(`[orderDeadline] Job ${job.id} failed:`, err.message);
  });

  orderDeadlineQueue.on('completed', (job) => {
    console.log(`[orderDeadline] Job ${job.id} completed.`);
  });

  console.log('[orderDeadline] Queue initialised successfully.');
} catch (err) {
  console.warn('[orderDeadline] Failed to connect to Redis – deadline jobs disabled:', err.message);
  // Provide a no-op so imports never break
  orderDeadlineQueue = null;
}

/**
 * Schedule a deadline job for a newly created order.
 * @param {string} orderId - MongoDB ObjectId string
 * @param {Date|null} deadline - Date object for when the order is due
 */
const scheduleDeadlineJob = (orderId, deadline) => {
  if (!orderDeadlineQueue) return;

  const delay = deadline ? new Date(deadline) - Date.now() : null;
  if (!delay || delay <= 0) return;

  orderDeadlineQueue
    .add({ orderId }, { delay, attempts: 2, backoff: { type: 'exponential', delay: 5000 } })
    .then((job) => console.log(`[orderDeadline] Job ${job.id} scheduled in ${Math.round(delay / 60000)} min for order ${orderId}`))
    .catch((err) => console.error('[orderDeadline] Failed to schedule job:', err.message));
};

module.exports = { scheduleDeadlineJob, orderDeadlineQueue };
