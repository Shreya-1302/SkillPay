const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyOrdersClient,
  getMyOrdersStudent,
  getOrderById,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // All order routes are protected

router.post('/', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/client/my-orders', getMyOrdersClient);
router.get('/student/my-orders', getMyOrdersStudent);
router.get('/:id', getOrderById);

module.exports = router;
