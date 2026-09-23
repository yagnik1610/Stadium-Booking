const express = require('express');
const router = express.Router();
const {
  createReview,
  getStadiumReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getAllReviews,
  getEligibleBookingsForReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// @route   GET /api/reviews/stadium/:stadiumId
// @desc    Get reviews for a specific stadium
router.get('/stadium/:stadiumId', getStadiumReviews);

// ==========================================
// PROTECTED STATIC ROUTES (Must be before /:id)
// ==========================================

// @route   GET /api/reviews/my
// @desc    Get logged in user's reviews
router.get('/my', protect, getMyReviews);

// @route   GET /api/reviews/eligible-bookings/:stadiumId
// @desc    Check if user has eligible bookings to review
router.get('/eligible-bookings/:stadiumId', protect, getEligibleBookingsForReview);

// @route   GET /api/reviews/admin/all
// @desc    Get all reviews (Admin only)
router.get('/admin/all', protect, admin, getAllReviews);

// @route   POST /api/reviews
// @desc    Create a new review
router.post('/', protect, createReview);

// ==========================================
// DYNAMIC ID ROUTES
// ==========================================

// @route   GET /api/reviews/:id
// @desc    Get single review by ID
router.get('/:id', protect, getReviewById);

// @route   PUT /api/reviews/:id
// @desc    Update a review
router.put('/:id', protect, updateReview);

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
router.delete('/:id', protect, deleteReview);

module.exports = router;
