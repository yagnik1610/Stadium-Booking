const express = require('express');
const router = express.Router();
const {
  addFavorite,
  getMyFavorites,
  removeFavorite,
  checkFavoriteStatus
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

// All favorite routes require authentication
router.use(protect);

// ==========================================
// STATIC & SPECIFIC ROUTES
// ==========================================

// @route   GET /api/favorites/my
// @desc    Get logged in user's favorites
router.get('/my', getMyFavorites);

// @route   GET /api/favorites/check/:stadiumId
// @desc    Check if a stadium is favorited by the logged in user
router.get('/check/:stadiumId', checkFavoriteStatus);

// ==========================================
// ROOT & DYNAMIC ROUTES
// ==========================================

// @route   POST /api/favorites
// @desc    Add a stadium to favorites
router.post('/', addFavorite);

// @route   DELETE /api/favorites/:stadiumId
// @desc    Remove a stadium from favorites
router.delete('/:stadiumId', removeFavorite);

module.exports = router;
