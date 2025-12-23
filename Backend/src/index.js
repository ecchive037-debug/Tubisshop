const express = require('express');
const cors = require('cors');
const app = express();

app.set('trust proxy', 1);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://tubisshop.com',
      'https://www.tubisshop.com'
    ];

    callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/auth', require('../src/Routes/admin.route'));
app.use('/api', require('../src/Routes/product.route'));
app.use('/api/order', require('../src/Routes/order.route'));
app.use('/api/notifications', require('../src/Routes/notification.route'));

// Error Handler
app.use((err, req, res, next) => {
  if (!err) return next();

  if (err.status === 413) {
    return res.status(413).json({
      message: 'Payload too large (20MB max)',
    });
  }

  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

module.exports = app;
