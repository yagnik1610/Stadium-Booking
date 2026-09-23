const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stadium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stadium',
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    default: ''
  },
  photo: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

// Compound unique index to prevent the same user from reviewing the same booking more than once
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });
reviewSchema.index({ stadium: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
