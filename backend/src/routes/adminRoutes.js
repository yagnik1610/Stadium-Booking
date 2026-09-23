const express = require('express');
const router = express.Router();
const { getDashboardStats, getEventAttendees, getAllBookings, getAllUsers } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.use(protect);
router.use(admin);

router.get('/stats', getDashboardStats);
router.get('/events/:id/attendees', getEventAttendees);
router.get('/bookings', getAllBookings);
router.get('/users', getAllUsers);

module.exports = router;
