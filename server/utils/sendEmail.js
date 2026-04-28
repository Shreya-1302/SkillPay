const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"FreelanceHub" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email',
    html: `<h2>Your OTP is: <strong>${otp}</strong></h2><p>Expires in 10 minutes.</p>`,
  });
};

module.exports = { sendOTPEmail };