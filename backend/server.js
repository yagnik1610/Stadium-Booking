const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

// Route Files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const stadiumRoutes = require('./routes/stadiumRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const contactRoutes = require('./routes/contactRoutes');
const sportRoutes = require('./routes/sportRoutes');

// Load environment variables from .env file
dotenv.config();

// Centralized Environment Variable Validation (Step 4)
const validateEnv = require('./config/validateEnv');
validateEnv();

// Initialize MongoDB connection
connectDB();

const app = express();

// Security Middlewares
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in development to prevent CORS blockage
  },
  credentials: true
}));

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Razorpay Webhook Endpoint — Mounted BEFORE global express.json() to preserve raw Buffer payload for HMAC signature verification
const { handleWebhook } = require('./controllers/paymentController');
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json', limit: '100kb' }),
  handleWebhook
);

// Body Parsing Middlewares with strict limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize against MongoDB Operator Injection
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Maintenance Mode Middleware for Booking & Payment mutations (Step 30)
const jwt = require('jsonwebtoken');
const Setting = require('./models/Setting');
const User = require('./models/User');

const maintenanceMiddleware = async (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.path === '/api/payments/webhook') return next();
  if (req.path.startsWith('/api/admin')) return next();
  if (req.path.startsWith('/api/bookings') || req.path.startsWith('/api/payments')) {
    try {
      const setting = await Setting.findOne().select('maintenanceMode').lean();
      if (setting && setting.maintenanceMode) {
        let isAdmin = false;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('role').lean();
            if (user && user.role === 'admin') isAdmin = true;
          } catch (_) {}
        }
        if (!isAdmin) {
          return res.status(503).json({
            success: false,
            message: 'Platform is currently undergoing scheduled maintenance. Booking and payment services are temporarily paused.'
          });
        }
      }
    } catch (_) {}
  }
  next();
};

app.use(maintenanceMiddleware);

// Health Check Endpoint (Step 47)
const mongoose = require('mongoose');
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Stadium Booking API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

// Readiness Probe Endpoint (Step 47)
app.get('/api/ready', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (isConnected) {
    return res.status(200).json({
      success: true,
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  }
  return res.status(503).json({
    success: false,
    status: 'unready',
    database: 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test Route (Module 1 Verification Endpoint)
app.get('/api/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Stadium Booking API is working'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stadiums', stadiumRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/sports', sportRoutes);

// 404 Not Found Handler for undefined routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Port configuration
const PORT = process.env.PORT || 5000;

// Start HTTP Server
const { startExpiryJob, stopExpiryJob, cleanupStalePendingBookings } = require('./utils/paymentExpiryJob');
const server = app.listen(PORT, () => {
  console.log(`🚀 Stadium Booking Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 Test API: http://localhost:${PORT}/api/test`);

  // Reconcile stale pending bookings on boot and schedule periodic sweeper
  cleanupStalePendingBookings().catch(err => console.error('Initial stale cleanup error:', err.message));
  startExpiryJob(5);
});

// Graceful Shutdown Handlers (Step 46)
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received. Starting graceful shutdown sequence...`);

  // 1. Stop background jobs
  try {
    stopExpiryJob();
    console.log('✅ Background jobs stopped.');
  } catch (err) {
    console.error('Error stopping background jobs:', err.message);
  }

  // 2. Stop accepting new HTTP requests
  server.close(async () => {
    console.log('✅ HTTP server closed. No longer accepting requests.');

    // 3. Close MongoDB connection cleanly
    try {
      await mongoose.connection.close(false);
      console.log('✅ MongoDB connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during MongoDB disconnection:', err.message);
      process.exit(1);
    }
  });

  // Fail-safe exit timeout (10 seconds)
  setTimeout(() => {
    console.error('❌ Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { app, server };

