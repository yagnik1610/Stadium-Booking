const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// All user routes require authentication
router.use(protect);

// @route   GET /api/users/profile
// @route   PUT /api/users/profile
router.route('/profile')
  .get(getUserProfile)
  .put(updateUserProfile);

// @route   PUT /api/users/change-password
router.put('/change-password', changePassword);

module.exports = router;
