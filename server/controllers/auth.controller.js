const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { sendOTPEmail } = require('../utils/sendEmail');
const { generateOTP } = require('../utils/generateOTP');
const ApiError = require('../utils/ApiError');
const jwt = require('jsonwebtoken');

// REGISTER
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return next(new ApiError(400, 'Email already registered'));

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const { otp, otpExpiry } = generateOTP();

    const user = await User.create({ name, email, passwordHash, role, otp, otpExpiry });

    await sendOTPEmail(email, otp);

    res.status(201).json({ success: true, message: 'Registered! Check your email for OTP.' });
  } catch (err) {
    next(err);
  }
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.params;
    const user = await User.findOne({ otp, otpExpiry: { $gt: new Date() } });

    if (!user) return next(new ApiError(400, 'Invalid or expired OTP'));

    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified! You can now log in.' });
  } catch (err) {
    next(err);
  }
};

// LOGIN
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return next(new ApiError(400, 'Invalid credentials'));

    if (!user.emailVerified) return next(new ApiError(403, 'Please verify your email first'));

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return next(new ApiError(400, 'Invalid credentials'));

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true, accessToken, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
  } catch (err) {
    next(err);
  }
};

// REFRESH TOKEN
exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return next(new ApiError(401, 'No refresh token'));

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const accessToken = generateAccessToken(decoded.id);

    res.json({ success: true, accessToken });
  } catch (err) {
    next(new ApiError(401, 'Invalid refresh token'));
  }
};