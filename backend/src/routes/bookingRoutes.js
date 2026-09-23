const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getBookedTurfSlots
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/turf-slots', getBookedTurfSlots);
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
