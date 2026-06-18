require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to DB');
    const user = await User.findOne({ role: 'student' }).lean();
    if (!user) {
      console.log('No student user found in DB');
      process.exit(1);
    }
    console.log('Found user:', user.email);

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    console.log('Generated JWT token');

    // Create a FormData object (native in Node 20+)
    const formData = new FormData();
    formData.append('name', user.name + ' Multipart');
    formData.append('bio', 'Updated bio multipart ' + Date.now());
    formData.append('skills', 'React, Node, Testing, Multipart');

    console.log('Sending Multipart PATCH to http://localhost:5000/api/auth/me...');
    try {
      const response = await axios.patch('http://localhost:5000/api/auth/me', formData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Success response:', response.status, response.data);
    } catch (err) {
      console.log('Error caught:');
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Data:', err.response.data);
      } else {
        console.log(err.message || err);
      }
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
