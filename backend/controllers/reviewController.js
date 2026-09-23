const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Stadium = require('../models/Stadium');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { stadium: stadiumId, booking: bookingId, rating, comment, photo } = req.body;

    // 1. Basic Validation
    if (!stadiumId || !bookingId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Please provide stadium, booking, and rating'
      });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters'
      });
    }

    // 2. Validate Stadium
    const stadium = await Stadium.findOne({ _id: stadiumId, isActive: true });
    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: 'Stadium not found or is inactive'
      });
    }

    // 3. Validate Booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // 4. Validate Authorization & Business Logic
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this booking'
      });
    }

    if (booking.stadium.toString() !== stadiumId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Booking does not belong to the specified stadium'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review a completed booking'
      });
    }

    // 5. Create Review
    // The compound unique index { user: 1, booking: 1 } will prevent duplicates,
    // but we can also manually check to return a cleaner 409 error.
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      booking: bookingId
    });

    if (alreadyReviewed) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    const review = await Review.create({
      user: req.user._id,
      stadium: stadiumId,
      booking: bookingId,
      rating,
      comment: comment || '',
      photo: photo || ''
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format provided' });
    }
    // Fallback for MongoDB duplicate key error code 11000
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this booking' });
    }
    next(error);
  }
};

// @desc    Get stadium reviews
// @route   GET /api/reviews/stadium/:stadiumId
// @access  Public
const getStadiumReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ stadium: req.params.stadiumId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((acc, item) => acc + item.rating, 0);
      // Calculate and round to 1 decimal place (e.g. 4.5)
      averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      reviews
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    next(error);
  }
};

// @desc    Get logged in user's reviews
// @route   GET /api/reviews/my
// @access  Private
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('stadium', 'name city')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get review by ID
// @route   GET /api/reviews/:id
// @access  Private
const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name')
      .populate('stadium', 'name city');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Auth logic: Only the owner or an admin can view a single review via this endpoint
    if (review.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this review'
      });
    }

    res.status(200).json({
      success: true,
      review
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Review ID format' });
    }
    next(error);
  }
};

// @desc    Update user's own review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    
    if (rating && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters'
      });
    }

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Auth logic: Only the owner (or admin) can update
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update only allowed fields
    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment; // Allows empty string

    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Review ID format' });
    }
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Auth logic: Only the owner or an admin can delete
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await Review.deleteOne({ _id: review._id });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Review ID format' });
    }
    next(error);
  }
};

// @desc    Get all reviews (Admin only)
// @route   GET /api/reviews/admin/all
// @access  Private/Admin
const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'name email')
      .populate('stadium', 'name city')
      .populate('booking', 'bookingDate startTime endTime')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get eligible bookings for review by logged-in user
// @route   GET /api/reviews/eligible-bookings/:stadiumId
// @access  Private
const getEligibleBookingsForReview = async (req, res, next) => {
  try {
    const stadiumId = req.params.stadiumId;

    // Find completed bookings for this user & stadium
    const completedBookings = await Booking.find({
      user: req.user._id,
      stadium: stadiumId,
      status: 'completed'
    }).sort({ bookingDate: -1 });

    if (completedBookings.length === 0) {
      return res.status(200).json({
        success: true,
        isEligible: false,
        eligibleBookings: []
      });
    }

    // Check existing reviews
    const existingReviews = await Review.find({
      user: req.user._id,
      stadium: stadiumId
    }).select('booking');

    const reviewedBookingIds = new Set(existingReviews.map(r => r.booking.toString()));
    const unreviewed = completedBookings.filter(b => !reviewedBookingIds.has(b._id.toString()));

    res.status(200).json({
      success: true,
      isEligible: unreviewed.length > 0,
      eligibleBookings: unreviewed
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getStadiumReviews,
  getMyReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getAllReviews,
  getEligibleBookingsForReview
};
