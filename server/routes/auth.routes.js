const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
} = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:otp', verifyEmail);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);

module.exports = router;