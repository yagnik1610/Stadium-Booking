const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  getAdminStadiums,
  getAdminReviews,
  getAdminPayments,
  getUserStats,
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings,
  broadcastNotification,
  getEmailLogs
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// All admin routes require authentication and admin privileges
router.use(protect, admin);

// ==========================================
// USER ROUTES
// ==========================================
// @route   GET /api/admin/users
router.get('/users', getUsers);

// @route   GET /api/admin/users/:id/stats
router.get('/users/:id/stats', getUserStats);

// @route   GET /api/admin/users/:id
// @route   PUT /api/admin/users/:id
router.route('/users/:id')
  .get(getUserById)
  .put(updateUser);

// @route   PUT /api/admin/users/:id/status
router.put('/users/:id/status', updateUserStatus);


// ==========================================
// STADIUM ROUTES
// ==========================================
// @route   GET /api/admin/stadiums
router.get('/stadiums', getAdminStadiums);


// ==========================================
// REVIEW ROUTES
// ==========================================
// @route   GET /api/admin/reviews
router.get('/reviews', getAdminReviews);


// ==========================================
// PAYMENT ROUTES
// ==========================================
// @route   GET /api/admin/payments
router.get('/payments', getAdminPayments);


// ==========================================
// ACTIVITY LOGS
// ==========================================
// @route   GET /api/admin/activity
// @route   GET /api/admin/activity-logs
router.get('/activity', getActivityLogs);
router.get('/activity-logs', getActivityLogs);

// ==========================================
// EMAIL DELIVERY LOGS
// ==========================================
// @route   GET /api/admin/email-logs
router.get('/email-logs', getEmailLogs);


// ==========================================
// SYSTEM SETTINGS
// ==========================================
// @route   GET /api/admin/settings
// @route   PUT /api/admin/settings
router.route('/settings')
  .get(getSystemSettings)
  .put(updateSystemSettings);


// ==========================================
// BROADCAST NOTIFICATION
// ==========================================
// @route   POST /api/admin/notifications/broadcast
// @route   POST /api/admin/broadcast-notification
router.post('/notifications/broadcast', broadcastNotification);
router.post('/broadcast-notification', broadcastNotification);

module.exports = router;

