const express = require('express');
const router = express.Router();
const {
  getAllStadiums,
  getStadiumById,
  createStadium,
  updateStadium,
  deleteStadium
} = require('../controllers/stadiumController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getAllStadiums);
router.get('/:id', getStadiumById);
router.post('/', protect, admin, createStadium);
router.put('/:id', protect, admin, updateStadium);
router.delete('/:id', protect, admin, deleteStadium);

module.exports = router;
