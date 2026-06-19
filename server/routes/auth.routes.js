const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  updateProfile,
  getMe,
  resendOtp,
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');
const { validate, registerRules, loginRules } = require('../middleware/validate.middleware');
const { uploadAvatar } = require('../middleware/upload.middleware');

router.post('/register', validate(registerRules), register);
router.post('/login', validate(loginRules), login);
router.get('/verify-email/:otp', verifyEmail);
router.post('/resend-otp', resendOtp);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.patch('/me', protect, uploadAvatar, updateProfile);


module.exports = router;