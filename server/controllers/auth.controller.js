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

    // ── Check for existing user ─────────────────────────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.emailVerified) {
        // Fully registered — tell the user to just log in
        return next(new ApiError(400, 'An account with this email already exists. Please sign in.'));
      }
      // Unverified user (e.g., previous registration timed out before OTP arrived).
      // Refresh their OTP and resend the email so they can complete sign-up.
      const { otp, otpExpiry } = generateOTP();
      existingUser.name        = name;
      existingUser.role        = role || existingUser.role || 'client';
      existingUser.otp         = otp;
      existingUser.otpExpiry   = otpExpiry;
      await existingUser.save({ validateBeforeSave: false });

      _sendOtpEmail(existingUser.email, existingUser.name, otp);

      return res.status(200).json({
        success: true,
        message:
          'We found an unverified account with this email. A fresh OTP has been sent — please check your inbox (and spam folder).',
      });
    }

    // ── New user ─────────────────────────────────────────────────────────
    // bcrypt cost 8 ≈ 40-80 ms (vs cost 10 ≈ 150-300 ms) — still secure, much faster
    const salt         = await bcrypt.genSalt(8);
    const passwordHash = await bcrypt.hash(password, salt);
    const { otp, otpExpiry } = generateOTP();

    const user = await User.create({
      name,
      email,
      collegeEmail,
      passwordHash,
      role: role || 'client',
      otp,
      otpExpiry,
    });

    // Dev mode: no email credentials → auto-verify immediately
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      user.emailVerified = true;
      user.otp           = undefined;
      user.otpExpiry     = undefined;
      await user.save({ validateBeforeSave: false });
      console.log(`[DEV] Auto-verified ${user.email}. OTP was: ${otp}`);
      return res.status(201).json({
        success: true,
        message: 'Registration successful. [DEV mode] You can log in now.',
      });
    }

    // Fire email in the background — don't block the HTTP response
    _sendOtpEmail(user.email, user.name, otp);

    return res.status(201).json({
      success: true,
      message:
        'Registration successful! Check your email (and spam/junk folder) for a 6-digit OTP. It is valid for 10 minutes.',
    });
  } catch (error) {
    next(error);
  }
};

// ── Internal helper: fire-and-forget OTP email ────────────────────────────────
function _sendOtpEmail(email, name, otp) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
      <h2 style="color:#6366f1;margin-top:0">Verify your SkillPay account</h2>
      <p>Hi <strong>${name}</strong>, welcome to SkillPay!</p>
      <p>Use the OTP below to verify your email. It expires in <strong>10 minutes</strong>.</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;
                  padding:20px;background:#f3f4f6;border-radius:8px;margin:20px 0;color:#111827">${otp}</div>
      <p style="color:#6b7280;font-size:13px">If you did not sign up for SkillPay, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
      <p style="color:#9ca3af;font-size:11px">SkillPay — India's Student Freelance Marketplace</p>
    </div>
  `;

  sendEmail(email, 'Your SkillPay OTP Verification Code', html)
    .then(() => console.log(`[Email] OTP sent to ${email}`))
    .catch((err) => console.error(`[Email] Failed to send OTP to ${email}:`, err.message));
}

// @desc    Resend OTP to an unverified email
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new ApiError(400, 'Email is required'));

    const user = await User.findOne({ email });
    if (!user)         return next(new ApiError(404, 'No account found with this email'));
    if (user.emailVerified) {
      return res.status(200).json({ success: true, message: 'Your email is already verified. Please sign in.' });
    }

    const { otp, otpExpiry } = generateOTP();
    user.otp       = otp;
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    _sendOtpEmail(user.email, user.name, otp);

    return res.status(200).json({
      success: true,
      message: 'A new OTP has been sent to your email. Check your inbox and spam folder.',
    });
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
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        avatar: user.avatar,
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

// @desc    Get current logged-in user (fresh from DB, includes live wallet balance)
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -otp -otpExpiry');
    if (!user) return next(new ApiError(404, 'User not found'));
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        collegeEmail: user.collegeEmail,
        emailVerified: user.emailVerified,
        role: user.role,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        bio: user.bio,
        skills: user.skills,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return next(new ApiError(400, 'OTP and new password are required'));
    }

    if (newPassword.length < 6) {
      return next(new ApiError(400, 'Password must be at least 6 characters'));
    }

    const user = await User.findOne({
      otp,
      otpExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ApiError(400, 'Invalid or expired OTP'));
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

const cloudinary = require('../config/cloudinary');

// @desc    Update logged-in user profile (name, avatar, bio, skills)
// @route   PATCH /api/auth/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, skills } = req.body;
    let avatarUrl = req.body.avatar;

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const uploadResponse = await cloudinary.uploader.upload(dataURI, {
        folder: 'skillpay/avatars',
      });
      avatarUrl = uploadResponse.secure_url;
    }

    const updates = {};
    if (name) updates.name = name;
    if (avatarUrl !== undefined) updates.avatar = avatarUrl;
    if (bio !== undefined) updates.bio = bio;
    if (skills !== undefined) {
      if (typeof skills === 'string') {
        updates.skills = skills.split(',').map(s => s.trim()).filter(s => s);
      } else {
        updates.skills = skills;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true, select: '-passwordHash -otp -otpExpiry' }
    );

    if (!user) return next(new ApiError(404, 'User not found'));

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        bio: user.bio,
        skills: user.skills,
      },
    });
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
  resetPassword,
  updateProfile,
  getMe,
  resendOtp,
};