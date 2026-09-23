const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAnalytics,
  getReports
} = require('../controllers/adminDashboardController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// All dashboard routes require authentication and admin privileges
router.use(protect, admin);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard statistics and recent bookings
router.get('/dashboard', getDashboardStats);

// @route   GET /api/admin/analytics
// @desc    Get detailed operational analytics
router.get('/analytics', getAnalytics);

// @route   GET /api/admin/reports
// @desc    Get reports with summaries and filter criteria
router.get('/reports', getReports);

module.exports = router;
