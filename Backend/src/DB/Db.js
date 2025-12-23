const mongoose = require('mongoose');

mongoose.set('strictQuery', false);


const connectDB = () => {
  return mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('MongoDB connected');
      return mongoose;
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
};

module.exports = connectDB;