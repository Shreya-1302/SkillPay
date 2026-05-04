const express = require('express');
const {
  getBalance,
  getTransactions,
  addUPI,
  withdraw,
  getEarningsByMonth,
} = require('../controllers/wallet.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validate, withdrawRules } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(protect); // All wallet routes require authentication

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);

// Student only routes
router.use(authorize('student', 'freelancer'));

router.post('/add-upi', addUPI);
router.post('/withdraw', validate(withdrawRules), withdraw);
router.get('/earnings-by-month', getEarningsByMonth);

module.exports = router;
