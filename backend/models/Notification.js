const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'booking_created',
      'booking_confirmed',
      'booking_cancelled',
      'booking_rejected',
      'booking_completed',
      'booking_status_changed',
      'system'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  stadium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stadium',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for common queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
