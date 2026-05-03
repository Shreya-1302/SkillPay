const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  createOrder,
  verifyPayment,
  getMyOrdersClient,
  getMyOrdersStudent,
  getOrderById,
  raiseDispute,
} = require('../controllers/order.controller');

router.use(protect);

router.post('/', requireRole('client'), createOrder);
router.post('/verify', verifyPayment);
router.get('/client', requireRole('client'), getMyOrdersClient);
router.get('/student', requireRole('student'), getMyOrdersStudent);
router.get('/:id', getOrderById);
router.post('/:id/dispute', raiseDispute);

module.exports = router;
