const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, refresh } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email/:otp', verifyEmail);
router.post('/refresh', refresh);

module.exports = router;