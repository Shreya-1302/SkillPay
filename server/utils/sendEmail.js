const nodemailer = require('nodemailer');

// Singleton transporter — created once and reused for all emails.
// This avoids the overhead of creating a new SMTP connection on every call
// and prevents the 30-second hangs that happen when Gmail auth fails.
let _transporter = null;

const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Fail fast — don't hang for 30+ seconds if SMTP is unreachable
    connectionTimeout: 10000, // 10 s
    greetingTimeout:  10000,
    socketTimeout:    10000,
  });

  return _transporter;
};

/**
 * Send an HTML email via Gmail.
 * @throws {Error} if sending fails — callers must handle this.
 */
const sendEmail = async (to, subject, html) => {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"SkillPay" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('[Email] Sent to', to, '—', info.response);
  return true;
};

module.exports = sendEmail;