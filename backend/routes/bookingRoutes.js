const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// All booking routes require authentication
router.use(protect);

// ==========================================
// STATIC ROUTES (Must be before /:id)
// ==========================================

// @route   GET /api/bookings/my
// @desc    Get logged in user's bookings
router.get('/my', getMyBookings);

// @route   GET /api/bookings/admin/all
// @desc    Get all bookings (Admin only)
router.get('/admin/all', admin, getAllBookings);

// @route   POST /api/bookings
// @desc    Create a new booking
router.post('/', createBooking);

// ==========================================
// DYNAMIC ID ROUTES
// ==========================================

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
router.get('/:id', getBookingById);

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
router.put('/:id/cancel', cancelBooking);

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status (Admin only)
router.put('/:id/status', admin, updateBookingStatus);

module.exports = router;
