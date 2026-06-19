/**
 * cleanup-unverified.js
 * Finds all unverified users and prints them, then auto-verifies them
 * so they can log in immediately.
 * Run from /server directory: node cleanup-unverified.js
 */
require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./models/User');

  const unverified = await User.find({ emailVerified: false });
  console.log(`\nFound ${unverified.length} unverified user(s):\n`);
  unverified.forEach(u => console.log(`  - ${u.email} | role: ${u.role} | created: ${u.createdAt}`));

  if (unverified.length === 0) {
    console.log('Nothing to fix.');
    await mongoose.connection.close();
    return;
  }

  // Auto-verify all of them so they can log in
  const result = await User.updateMany(
    { emailVerified: false },
    { $set: { emailVerified: true }, $unset: { otp: '', otpExpiry: '' } }
  );
  console.log(`\n✅ Auto-verified ${result.modifiedCount} user(s). They can now log in.`);
  await mongoose.connection.close();
  console.log('Done!');
}

run().catch(err => { console.error(err); process.exit(1); });
