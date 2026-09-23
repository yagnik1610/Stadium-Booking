const express = require('express');
const router = express.Router();
const {
  createStadium,
  getAllStadiums,
  getAdminAllStadiums,
  getStadiumById,
  updateStadium,
  deleteStadium,
  searchStadiums,
  checkAvailability,
  uploadStadiumCover,
  deleteStadiumCover,
  uploadStadiumGallery,
  deleteStadiumGalleryImage
} = require('../controllers/stadiumController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const {
  uploadCoverMiddleware,
  uploadGalleryMiddleware,
  mediaUploadRateLimiter
} = require('../middleware/uploadMiddleware');

// ==========================================
// PUBLIC ROUTES
// ==========================================

// @route   GET /api/stadiums
// @desc    Get all active stadiums
// IMPORTANT: Must be registered before /:id route
router.get('/', getAllStadiums);

// @route   GET /api/stadiums/search
// @desc    Search active stadiums by name, city, or sport
// IMPORTANT: Must be registered before /:id route
router.get('/search', searchStadiums);

// ==========================================
// ADMIN ONLY ROUTES
// ==========================================

// @route   GET /api/stadiums/admin/all
// @desc    Get all stadiums (active & inactive)
// IMPORTANT: Must be registered before /:id route
router.get('/admin/all', protect, admin, getAdminAllStadiums);

// @route   POST /api/stadiums
// @desc    Create a new stadium
router.post('/', protect, admin, createStadium);

// ==========================================
// MEDIA UPLOAD ROUTES (ADMIN ONLY - PHASE 2C)
// ==========================================

// @route   POST /api/stadiums/:id/media/cover
// @desc    Upload or replace stadium cover image
router.post('/:id/media/cover', protect, admin, mediaUploadRateLimiter, uploadCoverMiddleware, uploadStadiumCover);

// @route   DELETE /api/stadiums/:id/media/cover
// @desc    Delete stadium cover image
router.delete('/:id/media/cover', protect, admin, deleteStadiumCover);

// @route   POST /api/stadiums/:id/media/gallery
// @desc    Upload multiple stadium gallery images
router.post('/:id/media/gallery', protect, admin, mediaUploadRateLimiter, uploadGalleryMiddleware, uploadStadiumGallery);

// @route   DELETE /api/stadiums/:id/media/gallery/:mediaId
// @desc    Delete a specific stadium gallery image
router.delete('/:id/media/gallery/:mediaId', protect, admin, deleteStadiumGalleryImage);

// ==========================================
// DYNAMIC ID ROUTES (MUST BE AT THE BOTTOM)
// ==========================================

// @route   GET /api/stadiums/:stadiumId/availability
// @desc    Check stadium availability (Public)
router.get('/:stadiumId/availability', checkAvailability);

// @route   GET /api/stadiums/:id
// @desc    Get single active stadium by ID (Public)
router.get('/:id', getStadiumById);

// @route   PUT /api/stadiums/:id
// @desc    Update stadium details (Admin)
router.put('/:id', protect, admin, updateStadium);

// @route   DELETE /api/stadiums/:id
// @desc    Soft delete (deactivate) stadium (Admin)
router.delete('/:id', protect, admin, deleteStadium);

module.exports = router;
