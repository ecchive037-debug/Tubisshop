const express = require('express');
const app = express();
const cors = require('cors');

const userRoute = require('../src/Routes/user.route');
const adminRoute = require('../src/Routes/admin.route');
const productRoute = require('../src/Routes/product.route');
const orderRoute = require('../src/Routes/order.route');
const notificationRoute = require('../src/Routes/notification.route');

// CORS configuration
const allowedOrigins = [
  'https://tubisshop.com',
  'https://www.tubisshop.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow Postman, server-to-server, mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests explicitly (IMPORTANT for UAE browsers)
app.options(/.*/, cors());

// Allow larger JSON bodies
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Routes
app.use('/api/auth', adminRoute);
app.use('/api', productRoute);
app.use('/api/order', orderRoute);
app.use('/api/notifications', notificationRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  if (!err) return next();

  const isPayloadTooLarge =
    err.status === 413 ||
    err.type === 'entity.too.large' ||
    err.code === 'LIMIT_FILE_SIZE';

  if (isPayloadTooLarge) {
    return res.status(413).json({
      message: 'Payload too large — please upload smaller images or use image URLs (limit 20MB).',
    });
  }

  console.error('Unhandled server error:', err.message);
  return res.status(err.status || 500).json({
    message: err.message || 'Server error',
  });
});

module.exports = app;
