const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set in .env');

  const opts = {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS:         45000,
  };

  let attempts = 0;
  while (attempts < 3) {
    try {
      await mongoose.connect(uri, opts);
      console.log(`  ✦  MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      attempts++;
      if (attempts >= 3) throw err;
      console.warn(`  ⚠  MongoDB connect attempt ${attempts}/3 failed. Retrying in 3s…`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};