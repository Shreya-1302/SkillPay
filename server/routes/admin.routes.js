const express = require('express');
const {
  getAllUsers,
  banUser,
  getAllOrders,
  getOrdersByMonth,
  getDisputedOrders,
  resolveDispute,
  getPlatformStats,
  adminUpdateGigStatus,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require auth and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/users')
  .get(getAllUsers);

router.route('/users/:id/ban')
  .patch(banUser);

// NOTE: /orders/disputes and /orders/by-month must come BEFORE /orders/:id
router.route('/orders/disputes')
  .get(getDisputedOrders);

router.route('/orders/by-month')
  .get(getOrdersByMonth);

router.route('/orders')
  .get(getAllOrders);

router.route('/orders/:id/resolve')
  .patch(resolveDispute);

router.route('/gigs/:id/status')
  .patch(adminUpdateGigStatus);

router.route('/stats')
  .get(getPlatformStats);

module.exports = router;
