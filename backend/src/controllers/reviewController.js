const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getMongoStatus } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');
const Review = require('../models/Review');
const Stadium = require('../models/Stadium');

// @desc    Get reviews for a stadium or event
// @route   GET /api/reviews/:targetId
// @access  Public
const getTargetReviews = asyncHandler(async (req, res) => {
  const { targetId } = req.params;

  let reviews = [];
  if (getMongoStatus()) {
    reviews = await Review.find({ targetId }).sort({ createdAt: -1 });
  } else {
    reviews = memoryStore.getReviewsByTarget(targetId);
  }

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

// @desc    Submit a review
// @route   POST /api/reviews
// @access  Private
const submitReview = asyncHandler(async (req, res) => {
  const { targetId, targetType, rating, title, comment } = req.body;

  if (!targetId || !rating || !comment) {
    throw new ApiError(400, 'Target ID, rating, and comment are required');
  }

  const reviewPayload = {
    userId: req.user.id || req.user._id,
    userName: req.user.name,
    userAvatar: req.user.avatar || '',
    targetId,
    targetType: targetType || 'stadium',
    rating: Number(rating),
    title: title || '',
    comment,
    verifiedAttendee: true
  };

  let newReview;
  if (getMongoStatus()) {
    newReview = await Review.create(reviewPayload);

    // Update stadium aggregate rating if target is a stadium
    if (targetType === 'stadium') {
      const allReviews = await Review.find({ targetId, targetType: 'stadium' });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await Stadium.findByIdAndUpdate(targetId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length
      });
    }
  } else {
    newReview = memoryStore.createReview(reviewPayload);
    if (targetType === 'stadium') {
      const allReviews = memoryStore.getReviewsByTarget(targetId);
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / (allReviews.length || 1);
      memoryStore.updateStadium(targetId, {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length
      });
    }
  }

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: newReview
  });
});

module.exports = { getTargetReviews, submitReview };
