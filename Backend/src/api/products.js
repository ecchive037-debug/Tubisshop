const mongoose = require('mongoose');
const Product = require('../models/Product');

// MongoDB URI from env
const MONGO_URI = process.env.MONGO_URI;

// Global cache for serverless
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds
    }).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = async function handler(req, res) {
  try {
    await connectDB();

    const count = await Product.countDocuments().exec();
    const products = await Product.find().exec();

    res.status(200).json({ count, products });
  } catch (err) {
    console.error('MongoDB Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
