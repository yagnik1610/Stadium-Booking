const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const { getMongoStatus } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');
const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const { name, phone, bio, favoriteSports, notificationPrefs, avatar } = req.body;

  let updatedUser;
  if (getMongoStatus()) {
    updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: name || req.user.name,
          phone: phone !== undefined ? phone : req.user.phone,
          bio: bio !== undefined ? bio : req.user.bio,
          avatar: avatar || req.user.avatar,
          favoriteSports: favoriteSports || req.user.favoriteSports,
          notificationPrefs: notificationPrefs || req.user.notificationPrefs
        }
      },
      { new: true }
    ).select('-password');
  } else {
    updatedUser = memoryStore.updateUser(userId, {
      name: name || req.user.name,
      phone: phone !== undefined ? phone : req.user.phone,
      bio: bio !== undefined ? bio : req.user.bio,
      avatar: avatar || req.user.avatar,
      favoriteSports: favoriteSports || req.user.favoriteSports,
      notificationPrefs: notificationPrefs || req.user.notificationPrefs
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser
  });
});

// @desc    Get user account metrics & statistics
// @route   GET /api/users/metrics
// @access  Private
const getUserMetrics = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;

  let bookings = [];
  if (getMongoStatus()) {
    bookings = await Booking.find({ userId });
  } else {
    bookings = memoryStore.getBookingsByUserId(userId);
  }

  const totalPasses = bookings.length;
  const activePasses = bookings.filter(b => b.bookingStatus === 'Confirmed').length;
  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const sportsAttended = [...new Set(bookings.map(b => b.sport).filter(Boolean))];

  res.status(200).json({
    success: true,
    data: {
      totalPasses,
      activePasses,
      totalSpent: Math.round(totalSpent * 100) / 100,
      sportsAttended
    }
  });
});

module.exports = { updateProfile, getUserMetrics };
