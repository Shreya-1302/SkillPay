const nodemailer = require('nodemailer');

let _transporter = null;

/**
 * Returns a cached nodemailer transporter using Gmail SMTP on port 587 (STARTTLS).
 * Port 587 is used instead of 465 because many cloud hosts (Render, Railway, etc.)
 * block outbound port 465 but allow 587.
 */
const getTransporter = () => {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,          // STARTTLS (not SSL) — works on Render
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,  // Gmail App Password (spaces are OK)
    },
    pool: true,             // Reuse SMTP connections
    maxConnections: 3,
    connectionTimeout: 15000,
    greetingTimeout:   15000,
    socketTimeout:     20000,
    tls: {
      rejectUnauthorized: false,  // Allow self-signed certs on some servers
    },
  });

  return _transporter;
};

/**
 * Pre-warm the SMTP connection at server startup.
 * Called once from server.js so the first registration email is instant.
 */
const warmUp = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Email] No credentials configured — email disabled.');
    return;
  }
  const t = getTransporter();
  t.verify((err) => {
    if (err) console.warn('[Email] SMTP warm-up failed:', err.message);
    else     console.log('[Email] SMTP ready on smtp.gmail.com:587');
  });
};

/**
 * Send an HTML email.
 * @throws {Error} on failure so callers can .catch() it.
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