const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllMyNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(protect);

// ==========================================
// STATIC ROUTES (Must precede dynamic /:id routes)
// ==========================================

// @route   GET /api/notifications/my
// @desc    Get logged in user's notifications
router.get('/my', getMyNotifications);

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications
router.get('/unread-count', getUnreadCount);

// @route   PUT /api/notifications/read-all
// @desc    Mark all user's notifications as read
router.put('/read-all', markAllAsRead);

// @route   DELETE /api/notifications
// @desc    Delete all logged-in user's notifications
router.delete('/', deleteAllMyNotifications);


// ==========================================
// DYNAMIC ID ROUTES
// ==========================================

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read
router.put('/:id/read', markAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a single notification
router.delete('/:id', deleteNotification);

module.exports = router;
