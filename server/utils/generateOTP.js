const generateOTP = () => {
  // Generate a 6-digit string
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Expiry timestamp (Date.now + 10min)
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  return { otp, otpExpiry };
};

module.exports = generateOTP;
