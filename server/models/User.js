const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:              { type: String, required: true },
  email:             { type: String, required: true, unique: true },
  collegeEmail:      { type: String },           // students only
  emailVerified:     { type: Boolean, default: false },
  passwordHash:      { type: String, required: true },
  role:              { type: String, enum: ['client', 'student', 'admin'], default: 'client' },
  walletBalance:     { type: Number, default: 0 },
  avatar:            { type: String },
  razorpayContactId: { type: String },
  razorpayFundAccId: { type: String },
  otp:               { type: String },           // temporary OTP
  otpExpiry:         { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);