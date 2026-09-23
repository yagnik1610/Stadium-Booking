const express = require('express');
const router = express.Router();
const {
  getSports,
  getSportById,
  createSport,
  updateSport,
  deleteSport
} = require('../controllers/sportController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Public listing
router.get('/', getSports);
router.get('/:id', getSportById);

// Admin-only operations
router.post('/', protect, admin, createSport);
router.put('/:id', protect, admin, updateSport);
router.delete('/:id', protect, admin, deleteSport);

module.exports = router;
