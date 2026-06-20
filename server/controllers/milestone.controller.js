const Order = require('../models/Order');
const Milestone = require('../models/Milestone');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { uploadBuffer } = require('../utils/uploadToCloudinary');
const sendEmail = require('../utils/sendEmail');

// ─── Commission constant ──────────────────────────────────────────────────────
const PLATFORM_COMMISSION_RATE = 0.08; // 8%

// ─── Helper: calculate fee breakdown ─────────────────────────────────────────
const calcCommission = (amount) => {
  const platformFee = parseFloat((amount * PLATFORM_COMMISSION_RATE).toFixed(2));
  const studentCredit = parseFloat((amount - platformFee).toFixed(2));
  return { platformFee, studentCredit };
};

// ─── Helper: check if all milestones for an order are approved ────────────────
const allMilestonesApproved = async (orderId) => {
  const milestones = await Milestone.find({ orderId });
  if (milestones.length === 0) return false;
  return milestones.every((m) => m.status === 'approved');
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create a milestone for an order
// @route POST /api/milestones
// @access Private (student only)
// ─────────────────────────────────────────────────────────────────────────────
const createMilestone = async (req, res, next) => {
  try {
    const { orderId, title, description, amount } = req.body;

    if (!orderId || !title || !amount) {
      return next(new ApiError(400, 'orderId, title and amount are required'));
    }

    // Verify the order exists and belongs to this student
    const order = await Order.findById(orderId);
    if (!order) return next(new ApiError(404, 'Order not found'));

    if (order.student.toString() !== req.user.id) {
      return next(new ApiError(403, 'You are not the student for this order'));
    }

    // Order must be active (in escrow or in progress)
    if (!['in_escrow', 'in_progress'].includes(order.status)) {
      return next(new ApiError(400, `Cannot add milestones to an order with status '${order.status}'`));
    }

    const milestone = await Milestone.create({
      orderId,
      title,
      description,
      amount,
    });

    // Move order to in_progress if it was still in_escrow
    if (order.status === 'in_escrow') {
      await Order.findByIdAndUpdate(orderId, { status: 'in_progress' });
    }

    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Student submits a milestone deliverable
// @route POST /api/milestones/:id/submit
// @access Private (student only)
// ─────────────────────────────────────────────────────────────────────────────
const submitMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id).populate({
      path: 'orderId',
      populate: { path: 'client', select: 'name email' },
    });

    if (!milestone) return next(new ApiError(404, 'Milestone not found'));

    // Verify this student owns the order
    const order = milestone.orderId;
    if (order.student.toString() !== req.user.id) {
      return next(new ApiError(403, 'Not authorized'));
    }

    // Only pending or revision_requested milestones can be submitted
    if (!['pending', 'revision_requested'].includes(milestone.status)) {
      return next(new ApiError(400, `Milestone is already '${milestone.status}' and cannot be submitted`));
    }

    // Upload deliverable file to Cloudinary if provided
    let deliverableUrl = milestone.deliverableUrl;
    if (req.file) {
      deliverableUrl = await uploadBuffer(req.file.buffer, 'deliverables');
    }

    milestone.status = 'submitted';
    milestone.deliverableUrl = deliverableUrl || null;
    milestone.deliverableNote = req.body.deliverableNote || null;
    milestone.revisionNote = null; // clear any previous revision note
    await milestone.save();

    // Notify client via email
    if (order.client?.email) {
      try {
        await sendEmail(
          order.client.email,
          `Milestone Submitted: "${milestone.title}"`,
          `
            <h2>Milestone Submitted for Review</h2>
            <p>The student has submitted work for milestone <strong>"${milestone.title}"</strong>.</p>
            <p><strong>Amount:</strong> ₹${milestone.amount}</p>
            ${milestone.deliverableNote ? `<p><strong>Student Note:</strong> ${milestone.deliverableNote}</p>` : ''}
            ${deliverableUrl ? `<p><a href="${deliverableUrl}">View Deliverable</a></p>` : ''}
            <p>Please log in to SkillPay to approve the milestone or request a revision.</p>
          `
        );
      } catch (emailError) {
        console.error('[Email Error] Failed to send milestone submission email:', emailError.message);
      }
    }

    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Client approves a milestone → commission deducted, student credited
// @route PATCH /api/milestones/:id/approve
// @access Private (client only)
// ─────────────────────────────────────────────────────────────────────────────
const approveMilestone = async (req, res, next) => {
  try {
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return next(new ApiError(404, 'Milestone not found'));

    const order = await Order.findById(milestone.orderId)
      .populate('student', 'name email walletBalance');

    if (!order) return next(new ApiError(404, 'Associated order not found'));

    // Only the client of this order can approve
    if (order.client.toString() !== req.user.id) {
      return next(new ApiError(403, 'Only the client of this order can approve milestones'));
    }

    // Milestone must be in 'submitted' state
    if (milestone.status !== 'submitted') {
      return next(new ApiError(400, `Milestone must be in 'submitted' state to approve (currently '${milestone.status}')`));
    }

    // ── Commission math ───────────────────────────────────────────────────────
    const { platformFee, studentCredit } = calcCommission(milestone.amount);

    // Atomically increment student wallet balance and get new balance
    const updatedStudent = await User.findByIdAndUpdate(
      order.student._id,
      { $inc: { walletBalance: studentCredit } },
      { new: true, select: 'walletBalance' }
    );

    // ── Append-only ledger entry ──────────────────────────────────────────────
    await WalletTransaction.create({
      userId: order.student._id,
      type: 'MILESTONE_CREDIT',
      amount: studentCredit,
      balanceAfter: updatedStudent.walletBalance,
      referenceId: milestone._id,
      status: 'completed',
      note: `Milestone "${milestone.title}" approved. Original: ₹${milestone.amount}, Platform fee (8%): ₹${platformFee}, Credited: ₹${studentCredit}`,
    });

    // ── Update milestone ──────────────────────────────────────────────────────
    milestone.status = 'approved';
    milestone.approvedAt = new Date();
    await milestone.save();

    // ── Check if ALL milestones for this order are now approved ───────────────
    const orderComplete = await allMilestonesApproved(order._id);
    if (orderComplete) {
      await Order.findByIdAndUpdate(order._id, { status: 'completed' });
    }

    // ── Email student ─────────────────────────────────────────────────────────
    if (order.student?.email) {
      try {
        await sendEmail(
          order.student.email,
          `💰 Milestone Approved: ₹${studentCredit} Credited`,
          `
            <h2>Milestone Approved!</h2>
            <p>Your milestone <strong>"${milestone.title}"</strong> has been approved by the client.</p>
            <table style="border-collapse:collapse;width:100%">
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Milestone Amount</strong></td><td style="padding:8px;border:1px solid #ddd">₹${milestone.amount}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>Platform Fee (8%)</strong></td><td style="padding:8px;border:1px solid #ddd">₹${platformFee}</td></tr>
              <tr style="background:#f0fff0"><td style="padding:8px;border:1px solid #ddd"><strong>Amount Credited to Wallet</strong></td><td style="padding:8px;border:1px solid #ddd">₹${studentCredit}</td></tr>
              <tr><td style="padding:8px;border:1px solid #ddd"><strong>New Wallet Balance</strong></td><td style="padding:8px;border:1px solid #ddd">₹${updatedStudent.walletBalance}</td></tr>
            </table>
            ${orderComplete ? '<p><strong>🎉 All milestones complete! The order has been marked as completed.</strong></p>' : ''}
            <p>Log in to SkillPay to request a withdrawal.</p>
          `
        );
      } catch (emailError) {
        console.error('[Email Error] Failed to send milestone approval email:', emailError.message);
      }
    }

    // ── Socket.IO real-time notification ─────────────────────────────────────
    try {
      const { getIO } = require('../utils/socketIO');
      const ioInstance = getIO();
      if (ioInstance) {
        ioInstance.to(order.student._id.toString()).emit('notification', {
          type: 'milestone_approved',
          message: `Milestone "${milestone.title}" approved! ₹${studentCredit} credited to your wallet.`,
        });
      }
    } catch (_) { /* socket optional */ }

    res.status(200).json({
      success: true,
      data: {
        milestone,
        commission: { platformFee, studentCredit },
        orderCompleted: orderComplete,
        newWalletBalance: updatedStudent.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Client requests a revision on a submitted milestone
// @route PATCH /api/milestones/:id/revision
// @access Private (client only)
// ─────────────────────────────────────────────────────────────────────────────
const requestRevision = async (req, res, next) => {
  try {
    const { revisionNote } = req.body;

    if (!revisionNote || !revisionNote.trim()) {
      return next(new ApiError(400, 'revisionNote is required when requesting a revision'));
    }

    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return next(new ApiError(404, 'Milestone not found'));

    const order = await Order.findById(milestone.orderId)
      .populate('student', 'name email');

    if (!order) return next(new ApiError(404, 'Associated order not found'));

    // Only the client can request revision
    if (order.client.toString() !== req.user.id) {
      return next(new ApiError(403, 'Only the client of this order can request revisions'));
    }

    // Can only request revision on submitted milestones
    if (milestone.status !== 'submitted') {
      return next(new ApiError(400, `Can only request revision on 'submitted' milestones (currently '${milestone.status}')`));
    }

    milestone.status = 'revision_requested';
    milestone.revisionNote = revisionNote.trim();
    await milestone.save();

    // Email student about revision request
    if (order.student?.email) {
      try {
        await sendEmail(
          order.student.email,
          `Revision Requested: "${milestone.title}"`,
          `
            <h2>Revision Requested</h2>
            <p>The client has requested a revision for milestone <strong>"${milestone.title}"</strong>.</p>
            <p><strong>Client's Note:</strong></p>
            <blockquote style="border-left:4px solid #ccc;margin:0;padding:8px 16px;color:#555">
              ${revisionNote}
            </blockquote>
            <p>Please update your work and resubmit the milestone on SkillPay.</p>
          `
        );
      } catch (emailError) {
        console.error('[Email Error] Failed to send milestone revision email:', emailError.message);
      }
    }

    res.status(200).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get all milestones for a specific order
// @route GET /api/milestones/order/:orderId
// @access Private (client or student of the order)
// ─────────────────────────────────────────────────────────────────────────────
const getMilestonesByOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return next(new ApiError(404, 'Order not found'));

    const userId = req.user.id;
    const isParticipant =
      order.client.toString() === userId || order.student.toString() === userId;

    if (!isParticipant) {
      return next(new ApiError(403, 'Not authorized to view milestones for this order'));
    }

    const milestones = await Milestone.find({ orderId: req.params.orderId }).sort({ createdAt: 1 });

    // Compute summary stats
    const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    const approvedAmount = milestones
      .filter((m) => m.status === 'approved')
      .reduce((sum, m) => sum + m.amount, 0);
    const { studentCredit: approvedCredit } = calcCommission(approvedAmount);

    res.status(200).json({
      success: true,
      data: milestones,
      summary: {
        total: milestones.length,
        approved: milestones.filter((m) => m.status === 'approved').length,
        pending: milestones.filter((m) => m.status === 'pending').length,
        submitted: milestones.filter((m) => m.status === 'submitted').length,
        revision_requested: milestones.filter((m) => m.status === 'revision_requested').length,
        totalAmount,
        approvedAmount,
        approvedCreditAfterFee: approvedCredit,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMilestone,
  submitMilestone,
  approveMilestone,
  requestRevision,
  getMilestonesByOrder,
};
