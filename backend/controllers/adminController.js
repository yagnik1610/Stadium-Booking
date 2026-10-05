const User = require('../models/User');
const Stadium = require('../models/Stadium');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Favorite = require('../models/Favorite');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const AuditLog = require('../models/AuditLog');
const EmailLog = require('../models/EmailLog');
const ContactMessage = require('../models/ContactMessage');
const { logAdminAction } = require('../utils/auditLogger');
const mongoose = require('mongoose');

// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const { search, role, isActive, page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage <= 0) return res.status(400).json({ success: false, message: 'Invalid page' });
    if (isNaN(parsedLimit) || parsedLimit <= 0) return res.status(400).json({ success: false, message: 'Invalid limit' });
    if (parsedLimit > 50) return res.status(400).json({ success: false, message: 'Limit cannot exceed 50' });

    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      },
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid User ID' });
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Name must be a valid string' });
    }
    if (email !== undefined && typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email must be a valid string' });
    }
    if (role !== undefined && typeof role !== 'string') {
      return res.status(400).json({ success: false, message: 'Role must be a valid string' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role safety checks
    if (role && role !== user.role) {
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }

      // Admin cannot demote themselves
      if (req.user._id.toString() === user._id.toString() && role === 'user') {
        return res.status(400).json({ success: false, message: 'You cannot demote yourself' });
      }

      // Ensure at least one admin remains
      if (user.role === 'admin' && role === 'user') {
        const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot demote the only active admin' });
        }
      }
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid User ID' });
    next(error);
  }
};

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Admin cannot deactivate themselves
    if (req.user._id.toString() === user._id.toString() && isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }

    // Ensure at least one active admin remains
    if (user.role === 'admin' && isActive === false) {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot deactivate the only active admin' });
      }
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({ success: true, message: `User account ${isActive ? 'activated' : 'deactivated'}`, user: { _id: user._id, isActive: user.isActive } });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid User ID' });
    next(error);
  }
};

// ==========================================
// ADMIN STADIUM MANAGEMENT
// ==========================================

// @desc    Get all stadiums (including inactive)
// @route   GET /api/admin/stadiums
// @access  Private/Admin
const getAdminStadiums = async (req, res, next) => {
  try {
    const { search, city, sport, isActive, minPrice, maxPrice, minCapacity, maxCapacity, facility, page = 1, limit = 10, sort } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage <= 0) return res.status(400).json({ success: false, message: 'Invalid page' });
    if (isNaN(parsedLimit) || parsedLimit <= 0) return res.status(400).json({ success: false, message: 'Invalid limit' });
    if (parsedLimit > 50) return res.status(400).json({ success: false, message: 'Limit cannot exceed 50' });

    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { location: searchRegex },
        { city: searchRegex }
      ];
    }

    if (city) {
      query.city = new RegExp(`^${city}$`, 'i');
    }

    if (sport) {
      query.sports = new RegExp(`^${sport}$`, 'i');
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (minPrice || maxPrice) {
      query.pricePerHour = {};
      if (minPrice) query.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
    }

    if (minCapacity || maxCapacity) {
      query.capacity = {};
      if (minCapacity) query.capacity.$gte = Number(minCapacity);
      if (maxCapacity) query.capacity.$lte = Number(maxCapacity);
    }

    if (facility) {
      const facilitiesArray = facility.split(',').map(f => new RegExp(`^${f.trim()}$`, 'i'));
      query.facilities = { $all: facilitiesArray };
    }

    let sortObj = { createdAt: -1 }; // Default
    if (sort) {
      switch (sort) {
        case 'price_asc': sortObj = { pricePerHour: 1 }; break;
        case 'price_desc': sortObj = { pricePerHour: -1 }; break;
        case 'name_asc': sortObj = { name: 1 }; break;
        case 'name_desc': sortObj = { name: -1 }; break;
        case 'capacity_asc': sortObj = { capacity: 1 }; break;
        case 'capacity_desc': sortObj = { capacity: -1 }; break;
        case 'oldest': sortObj = { createdAt: 1 }; break;
        case 'newest': sortObj = { createdAt: -1 }; break;
      }
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [stadiums, total] = await Promise.all([
      Stadium.find(query).sort(sortObj).skip(skip).limit(parsedLimit),
      Stadium.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.status(200).json({
      success: true,
      count: stadiums.length,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      },
      stadiums
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN REVIEW MANAGEMENT
// ==========================================

// @desc    Get all reviews
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getAdminReviews = async (req, res, next) => {
  try {
    const { stadium, user, rating, page = 1, limit = 10, sort } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage <= 0) return res.status(400).json({ success: false, message: 'Invalid page' });
    if (isNaN(parsedLimit) || parsedLimit <= 0) return res.status(400).json({ success: false, message: 'Invalid limit' });
    if (parsedLimit > 50) return res.status(400).json({ success: false, message: 'Limit cannot exceed 50' });

    let query = {};

    if (stadium) {
      if (!mongoose.Types.ObjectId.isValid(stadium)) return res.status(400).json({ success: false, message: 'Invalid stadium ID' });
      query.stadium = stadium;
    }

    if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
      query.user = user;
    }

    if (rating) {
      query.rating = Number(rating);
    }

    let sortObj = { createdAt: -1 }; // Default
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'rating_asc') sortObj = { rating: 1 };
    else if (sort === 'rating_desc') sortObj = { rating: -1 };

    const skip = (parsedPage - 1) * parsedLimit;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name email')
        .populate('stadium', 'name city')
        .populate('booking', 'bookingReference status')
        .sort(sortObj)
        .skip(skip)
        .limit(parsedLimit),
      Review.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      },
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ADMIN PAYMENT MANAGEMENT
// ==========================================

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Admin
const getAdminPayments = async (req, res, next) => {
  try {
    const { status, user, booking, fromDate, toDate, page = 1, limit = 10, sort } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage <= 0) return res.status(400).json({ success: false, message: 'Invalid page' });
    if (isNaN(parsedLimit) || parsedLimit <= 0) return res.status(400).json({ success: false, message: 'Invalid limit' });
    if (parsedLimit > 50) return res.status(400).json({ success: false, message: 'Limit cannot exceed 50' });

    let query = {};

    if (status) {
      query.status = status;
    }

    if (user) {
      if (!mongoose.Types.ObjectId.isValid(user)) return res.status(400).json({ success: false, message: 'Invalid user ID' });
      query.user = user;
    }

    if (booking) {
      if (!mongoose.Types.ObjectId.isValid(booking)) return res.status(400).json({ success: false, message: 'Invalid booking ID' });
      query.booking = booking;
    }

    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    let sortObj = { createdAt: -1 }; // Default
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'amount_asc') sortObj = { amount: 1 };
    else if (sort === 'amount_desc') sortObj = { amount: -1 };

    const skip = (parsedPage - 1) * parsedLimit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email')
        .populate({
          path: 'booking',
          select: 'bookingReference bookingDate startTime endTime status paymentStatus stadium',
          populate: { path: 'stadium', select: 'name city' }
        })
        .sort(sortObj)
        .skip(skip)
        .limit(parsedLimit),
      Payment.countDocuments(query)
    ]);

    const safePayments = payments.map(p => ({
      _id: p._id,
      user: p.user ? { name: p.user.name, email: p.user.email } : null,
      booking: p.booking ? {
        _id: p.booking._id,
        bookingReference: p.booking.bookingReference,
        bookingDate: p.booking.bookingDate,
        startTime: p.booking.startTime,
        endTime: p.booking.endTime,
        status: p.booking.status,
        stadium: p.booking.stadium ? { name: p.booking.stadium.name, city: p.booking.stadium.city } : null
      } : null,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId, // Safe to return for admin verification
      paidAt: p.paidAt,
      createdAt: p.createdAt
    }));

    const totalPages = Math.ceil(total / parsedLimit);

    res.status(200).json({
      success: true,
      count: safePayments.length,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      },
      payments: safePayments
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// USER STATS & DEEP-DIVE
// ==========================================

// @desc    Get user detailed activity stats (bookings, payments, reviews, favorites)
// @route   GET /api/admin/users/:id/stats
// @access  Private/Admin
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid User ID' });
    }

    const [user, bookings, payments, reviews, favoritesCount] = await Promise.all([
      User.findById(userId).select('-password'),
      Booking.find({ user: userId }).populate('stadium', 'name city').sort({ createdAt: -1 }),
      Payment.find({ user: userId }).sort({ createdAt: -1 }),
      Review.find({ user: userId }).populate('stadium', 'name').sort({ createdAt: -1 }),
      Favorite.countDocuments({ user: userId })
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const totalSpent = payments.reduce((acc, p) => p.status === 'paid' ? acc + (p.amount / 100) : acc, 0);

    res.status(200).json({
      success: true,
      user,
      stats: {
        totalBookings: bookings.length,
        totalPayments: payments.length,
        totalReviews: reviews.length,
        totalFavorites: favoritesCount,
        totalSpent: Math.round(totalSpent * 100) / 100
      },
      bookings,
      payments,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// ACTIVITY AUDIT LOGS
// ==========================================

// @desc    Get admin audit logs
// @route   GET /api/admin/activity
// @access  Private/Admin
const getActivityLogs = async (req, res, next) => {
  try {
    const { action, entity, page = 1, limit = 20 } = req.query;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = Math.min(50, parseInt(limit, 10) || 20);

    const query = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;

    const skip = (parsedPage - 1) * parsedLimit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('admin', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      AuditLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit) || 1
      },
      logs
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SYSTEM SETTINGS
// ==========================================

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSystemSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }
    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSystemSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    const allowedFields = [
      'businessName', 'contactEmail', 'contactPhone', 'defaultGstRate',
      'currency', 'timezone', 'cancellationCutoffHours', 'maxAdvanceBookingDays',
      'termsVersion', 'maintenanceMode', 'safetyRules', 'termsAndConditions'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    if (req.body.platformName) settings.businessName = req.body.platformName;
    if (req.body.gstConfig?.gstRatePercent !== undefined) settings.defaultGstRate = req.body.gstConfig.gstRatePercent;
    if (req.body.bookingConfig?.advanceBookingDays !== undefined) settings.maxAdvanceBookingDays = req.body.bookingConfig.advanceBookingDays;
    if (req.body.bookingConfig?.cancellationCutoffHours !== undefined) settings.cancellationCutoffHours = req.body.bookingConfig.cancellationCutoffHours;
    if (req.body.safetyRules) settings.safetyRules = req.body.safetyRules;
    if (req.body.termsAndConditions) settings.termsAndConditions = req.body.termsAndConditions;

    await settings.save();

    await logAdminAction(req.user._id, 'SETTINGS_UPDATED', 'Setting', settings._id, 'Updated system settings', req);

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BROADCAST NOTIFICATION
// ==========================================

// @desc    Send broadcast notification to users
// @route   POST /api/admin/notifications/broadcast
// @access  Private/Admin
const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, targetRole = 'all', specificUserId, target, userId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Please provide title and message' });
    }

    const effectiveTarget = target || targetRole;
    const effectiveUserId = specificUserId || userId;

    let targetUsers = [];
    if (effectiveUserId) {
      targetUsers = await User.find({ _id: effectiveUserId, isActive: true }).select('_id');
    } else if (effectiveTarget === 'user' || effectiveTarget === 'users') {
      targetUsers = await User.find({ role: 'user', isActive: true }).select('_id');
    } else if (effectiveTarget === 'admin' || effectiveTarget === 'admins') {
      targetUsers = await User.find({ role: 'admin', isActive: true }).select('_id');
    } else {
      targetUsers = await User.find({ isActive: true }).select('_id');
    }

    const notificationsToInsert = targetUsers.map(u => ({
      user: u._id,
      type: 'system',
      title: title.trim(),
      message: message.trim(),
      isRead: false
    }));

    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
    }

    await logAdminAction(
      req.user._id,
      'BROADCAST_SENT',
      'Notification',
      '',
      `Sent broadcast "${title}" to ${notificationsToInsert.length} user(s)`,
      req
    );

    res.status(200).json({
      success: true,
      message: `Notification broadcast sent to ${notificationsToInsert.length} user(s)`,
      recipientCount: notificationsToInsert.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all email delivery logs (Admin)
// @route   GET /api/admin/email-logs
// @access  Private/Admin
const getEmailLogs = async (req, res, next) => {
  try {
    const { status, emailType, search, page = 1, limit = 20 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage <= 0) return res.status(400).json({ success: false, message: 'Invalid page' });
    if (isNaN(parsedLimit) || parsedLimit <= 0) return res.status(400).json({ success: false, message: 'Invalid limit' });
    if (parsedLimit > 100) return res.status(400).json({ success: false, message: 'Limit cannot exceed 100' });

    let query = {};
    if (status) query.status = status;
    if (emailType) query.emailType = emailType;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [{ recipient: searchRegex }, { subject: searchRegex }, { idempotencyKey: searchRegex }];
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [logs, total] = await Promise.all([
      EmailLog.find(query)
        .populate('user', 'name email')
        .populate('booking', 'bookingReference bookingDate startTime endTime')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      EmailLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      },
      logs
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CONTACT MESSAGES MANAGEMENT
// ==========================================

// Helper to escape regex special characters
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// @desc    Get all contact messages
// @route   GET /api/admin/contact-messages
// @access  Private/Admin
const getContactMessages = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (isNaN(parsedPage) || parsedPage <= 0) return res.status(400).json({ success: false, message: 'Invalid page' });
    if (isNaN(parsedLimit) || parsedLimit <= 0) return res.status(400).json({ success: false, message: 'Invalid limit' });
    if (parsedLimit > 50) return res.status(400).json({ success: false, message: 'Limit cannot exceed 50' });

    let query = {};

    if (status && ['unread', 'read', 'archived'].includes(status)) {
      query.status = status;
    }

    if (search && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { subject: searchRegex },
        { bookingId: searchRegex }
      ];
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const [messages, total] = await Promise.all([
      ContactMessage.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      ContactMessage.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      },
      messages
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact message status
// @route   PUT /api/admin/contact-messages/:id/status
// @access  Private/Admin
const updateContactMessageStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Contact Message ID' });
    }

    if (!status || !['unread', 'read', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Allowed values are 'unread', 'read', or 'archived'"
      });
    }

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contactMessage) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Contact message status updated',
      contactMessage
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  getAdminStadiums,
  getAdminReviews,
  getAdminPayments,
  getUserStats,
  getActivityLogs,
  getSystemSettings,
  updateSystemSettings,
  broadcastNotification,
  getEmailLogs,
  getContactMessages,
  updateContactMessageStatus
};

