const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ''
  },
  targetType: {
    type: String,
    enum: ['stadium', 'event'],
    required: true
  },
  targetId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    default: ''
  },
  comment: {
    type: String,
    required: true
  },
  verifiedAttendee: {
    type: Boolean,
    default: true
  },
  helpfulVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  _id: false
});

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
