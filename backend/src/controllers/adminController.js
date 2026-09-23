const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getMongoStatus } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Stadium = require('../models/Stadium');
const User = require('../models/User');

// @desc    Get comprehensive Admin Dashboard stats & analytics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  let bookings = [];
  let events = [];
  let stadiums = [];
  let users = [];

  if (getMongoStatus()) {
    bookings = await Booking.find().sort({ createdAt: -1 });
    events = await Event.find();
    stadiums = await Stadium.find();
    users = await User.find().select('-password');
  } else {
    bookings = memoryStore.getBookings();
    events = memoryStore.getEvents();
    stadiums = memoryStore.getStadiums();
    users = memoryStore.getUsers();
  }

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.bookingStatus === 'Confirmed');

  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const eventRevenue = confirmedBookings.filter(b => b.type === 'event').reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const turfRevenue = confirmedBookings.filter(b => b.type === 'turf').reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  const totalTicketsSold = confirmedBookings
    .filter(b => b.type === 'event')
    .reduce((sum, b) => sum + (b.seats ? b.seats.length : (b.ticketCount || 1)), 0);

  // Revenue by Sport
  const sportBreakdown = {};
  confirmedBookings.forEach(b => {
    const sport = b.sport || 'Other';
    sportBreakdown[sport] = (sportBreakdown[sport] || 0) + (Number(b.totalAmount) || 0);
  });

  const sportStats = Object.keys(sportBreakdown).map(sport => ({
    sport,
    revenue: Math.round(sportBreakdown[sport] * 100) / 100
  }));

  // Occupancy metrics per stadium
  const stadiumOccupancy = stadiums.map(s => {
    const matchCount = events.filter(e => e.stadiumId === (s._id || s.id)).length;
    const bookedPasses = confirmedBookings.filter(b => b.stadiumName === s.name).length;
    return {
      id: s._id || s.id,
      name: s.name,
      city: s.city,
      type: s.venueType,
      capacity: s.capacity,
      activeEvents: matchCount,
      totalPassesIssued: bookedPasses,
      occupancyRate: s.capacity > 0 ? Math.min(100, Math.round((bookedPasses * 15 / s.capacity) * 100)) : 75
    };
  });

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        eventRevenue: Math.round(eventRevenue * 100) / 100,
        turfRevenue: Math.round(turfRevenue * 100) / 100,
        totalBookings,
        confirmedBookingsCount: confirmedBookings.length,
        totalTicketsSold,
        totalEvents: events.length,
        totalStadiums: stadiums.length,
        totalUsers: users.length
      },
      sportStats,
      stadiumOccupancy,
      recentBookings: bookings.slice(0, 15)
    }
  });
});

// @desc    Export attendee list for a specific match event
// @route   GET /api/admin/events/:id/attendees
// @access  Private/Admin
const getEventAttendees = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let bookings = [];

  if (getMongoStatus()) {
    bookings = await Booking.find({ eventId: id, bookingStatus: 'Confirmed' });
  } else {
    bookings = memoryStore.getBookings().filter(b => b.eventId === id && b.bookingStatus === 'Confirmed');
  }

  const attendees = bookings.map(b => ({
    bookingId: b.bookingId,
    name: b.userName,
    email: b.userEmail,
    seats: b.seats ? b.seats.join(', ') : 'N/A',
    stand: b.standName || 'General',
    gate: b.gateNumber || 'Gate 4',
    totalPaid: `${b.currency || '$'}${b.totalAmount}`,
    bookedAt: b.createdAt
  }));

  res.status(200).json({
    success: true,
    count: attendees.length,
    data: attendees
  });
});

// @desc    Get all bookings
// @route   GET /api/admin/bookings
// @access  Private/Admin
const getAllBookings = asyncHandler(async (req, res) => {
  let bookings;
  if (getMongoStatus()) {
    bookings = await Booking.find().sort({ createdAt: -1 });
  } else {
    bookings = memoryStore.getBookings();
  }

  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  let users;
  if (getMongoStatus()) {
    users = await User.find().select('-password').sort({ createdAt: -1 });
  } else {
    users = memoryStore.getUsers().map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });
  }

  res.status(200).json({ success: true, count: users.length, data: users });
});

module.exports = { getDashboardStats, getEventAttendees, getAllBookings, getAllUsers };
