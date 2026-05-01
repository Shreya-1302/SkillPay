const mongoose = require('mongoose');

const connectDB = async (retries = 5) => {
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB Connected Successfully');
      break;
    } catch (error) {
      console.error(`MongoDB Connection Failed: ${error.message}`);
      console.error(`Retries left: ${retries - 1}`);
      retries -= 1;
      console.log(`Waiting 5 seconds before retrying...`);
      await new Promise((res) => setTimeout(res, 5000));
      
      if (retries === 0) {
        console.error('Failed to connect to MongoDB. Exiting application.');
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;