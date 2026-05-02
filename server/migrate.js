require('dotenv').config();
const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./models/User');
  
  // Find users with old roles
  const all = await User.find({});
  console.log('All users:');
  all.forEach(u => console.log(' -', u.email, '| role:', u.role, '| verified:', u.emailVerified));
  
  let migrated = 0;
  for (const user of all) {
    let changed = false;
    // migrate old role names
    if (user.role === 'user') { user.role = 'client'; changed = true; }
    if (user.role === 'freelancer') { user.role = 'student'; changed = true; }
    // auto-verify for dev
    if (!user.emailVerified) { user.emailVerified = true; changed = true; }
    if (changed) {
      await user.save({ validateBeforeSave: false });
      migrated++;
    }
  }
  
  console.log('\nMigrated', migrated, 'users');
  await mongoose.connection.close();
  console.log('Done!');
}
migrate().catch(console.error);
