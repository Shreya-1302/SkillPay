const nodemailer = require('nodemailer');

let _transporter = null;

/**
 * Returns a cached nodemailer transporter.
 * Call warmUp() on server start to establish the connection early.
 */
const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    pool: true,           // Keep a pool of SMTP connections open
    maxConnections: 3,
    connectionTimeout: 10000,
    greetingTimeout:   10000,
    socketTimeout:     15000,
  });

  return _transporter;
};

/**
 * Call once at server startup to pre-warm the SMTP connection so the
 * first real email send is instant instead of waiting for TLS handshake.
 */
const warmUp = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const t = getTransporter();
  t.verify((err) => {
    if (err) console.warn('[Email] SMTP warm-up failed:', err.message);
    else     console.log('[Email] SMTP connection ready.');
  });
};

/**
 * Send an HTML email via Gmail.
 * @throws {Error} on failure — callers should .catch() it.
 */
const sendEmail = async (to, subject, html) => {
  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"SkillPay" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  console.log('[Email] Delivered to', to, '—', info.response);
  return true;
};

module.exports = sendEmail;
module.exports.warmUp = warmUp;