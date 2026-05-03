const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

require('dotenv').config();

async function run() {
  try {
    // connect to DB just to get a user
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const user = await User.findOne({});
    if (!user) throw new Error("No user found");
    
    // sign a token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create Gig
    const form = new FormData();
    form.append('title', 'Test gig');
    form.append('description', 'Test desc');
    form.append('category', 'Programming & Tech');
    form.append('basePrice', '1000');
    form.append('deliveryDays', '2');
    form.append('skills', JSON.stringify(['React']));

    const gigRes = await fetch('http://localhost:5000/api/gigs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    console.log("SUCCESS:", gigRes.status, await gigRes.text());
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    mongoose.connection.close();
  }
}
run();
