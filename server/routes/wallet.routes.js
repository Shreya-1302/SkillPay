const express = require('express');
const router = express.Router();
const { getEarningsByMonth } = require('../controllers/wallet.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/earnings-by-month', getEarningsByMonth);

module.exports = router;
