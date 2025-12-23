const express = require('express');
const cors = require('cors');

const adminRoute = require('./Routes/admin.route');
const productRoute = require('./Routes/product.route');
const orderRoute = require('./Routes/order.route');
const notificationRoute = require('./Routes/notification.route');

const app = express();

/* ===============================
   TRUST PROXY (Render + UAE)
================================ */
app.set('trust proxy', 1);

/* ===============================
   CORS CONFIG (SAFE)
================================ */
const allowedOrigins = [
  'https://tubisshop.com',
  'https://www.tubisshop.com',
  'https://tubisshop.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false); // DO NOT throw error
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

app.options('*', cors());

/* ===============================
   BODY LIMIT
================================ */
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

/* ===============================
   ROUTES
================================ */
app.use('/api/auth', adminRoute);
app.use('/api', productRoute);
app.use('/api/order', orderRoute);
app.use('/api/notifications', notificationRoute);

/* ===============================
   ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  if (!err) return next();

  if (
    err.status === 413 ||
    err.type === 'entity.too.large' ||
    err.code === 'LIMIT_FILE_SIZE'
  ) {
    return res.status(413).json({
      message: 'Payload too large (20MB max)'
    });
  }

  console.error('Server error:', err);
  res.status(500).json({ message: 'Server error' });
});

/* ===============================
   SERVER (Render ONLY)
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
