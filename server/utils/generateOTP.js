/**
 * Generates a random 6-digit OTP and its expiry timestamp.
 * @returns {Object} { otp, otpExpiry }
 */
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  return { otp, otpExpiry };
};

module.exports = { generateOTP };
