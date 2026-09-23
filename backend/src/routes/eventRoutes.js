const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  lockSeats,
  updateLiveScore,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/:id/lock-seats', protect, lockSeats);
router.put('/:id/live-score', protect, admin, updateLiveScore);
router.post('/', protect, admin, createEvent);
router.put('/:id', protect, admin, updateEvent);
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;
