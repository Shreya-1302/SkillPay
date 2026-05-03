const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const generateOTP = require('../utils/generateOTP');
const sendEmail = require('../utils/sendEmail');
const { signAccessToken, signRefreshToken } = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    let { name, email, collegeEmail, password, role } = req.body;
    
    if (!collegeEmail || collegeEmail.trim() === '') {
      collegeEmail = undefined;
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new ApiError(400, 'User already exists with this email'));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate OTP
    const { otp, otpExpiry } = generateOTP();

    // Create user
    const user = await User.create({
      name,
      email,
      collegeEmail,
      passwordHash,
      role: role || 'user',
      otp,
      otpExpiry,
    });

    // Send OTP via email
    const message = `
      <h1>Email Verification</h1>
      <p>Please use the following OTP to verify your email address. It is valid for 10 minutes.</p>
      <h2>${otp}</h2>
    `;

    try {
      await sendEmail(user.email, 'Verify your Email Address', message);
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email for OTP.',
      });
    } catch (err) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new ApiError(500, 'Email could not be sent'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with OTP
// @route   GET /api/auth/verify-email/:otp
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.params;

    const user = await User.findOne({
      otp,
      otpExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired OTP'));
    }

    user.emailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError(400, 'Please provide an email and password'));
    }

    // Check if user exists & select password
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return next(new ApiError(401, 'Please verify your email first'));
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid credentials'));
    }

    // Issue tokens
    const payload = { id: user._id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new ApiError(400, 'Refresh token is required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      
      const payload = { id: decoded.id, role: decoded.role };
      const newAccessToken = signAccessToken(payload);
      
      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      return next(new ApiError(401, 'Invalid or expired refresh token'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, 'There is no user with that email'));
    }

    // Generate OTP
    const { otp, otpExpiry } = generateOTP();

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    const message = `
      <h1>Password Reset</h1>
      <p>Please use the following OTP to reset your password. It is valid for 10 minutes.</p>
      <h2>${otp}</h2>
    `;

    try {
      await sendEmail(user.email, 'Password Reset OTP', message);
      res.status(200).json({
        success: true,
        message: 'OTP sent to email',
      });
    } catch (err) {
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new ApiError(500, 'Email could not be sent'));
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
};