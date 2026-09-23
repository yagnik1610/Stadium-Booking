const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { getMongoStatus } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');
const Event = require('../models/Event');
const Stadium = require('../models/Stadium');

// @desc    Get all match events with filtering and sorting
// @route   GET /api/events
// @access  Public
const getAllEvents = asyncHandler(async (req, res) => {
  const { sport, city, featured, search, status, sort } = req.query;

  if (getMongoStatus()) {
    let filter = {};
    if (sport && sport !== 'All') filter.sport = new RegExp(sport, 'i');
    if (city && city !== 'All') filter.city = new RegExp(city, 'i');
    if (status) filter.status = status;
    if (featured !== undefined) filter.featured = featured === 'true';

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { tournament: new RegExp(search, 'i') },
        { stadiumName: new RegExp(search, 'i') },
        { 'teamA.name': new RegExp(search, 'i') },
        { 'teamB.name': new RegExp(search, 'i') }
      ];
    }

    let query = Event.find(filter);

    // Sorting
    if (sort === 'price_asc') query = query.sort({ basePrice: 1 });
    else if (sort === 'price_desc') query = query.sort({ basePrice: -1 });
    else if (sort === 'date_desc') query = query.sort({ date: -1 });
    else query = query.sort({ date: 1 }); // Default soonest first

    const events = await query;
    return res.status(200).json({ success: true, count: events.length, data: events });
  } else {
    let events = memoryStore.getEvents();

    if (sport && sport !== 'All') {
      events = events.filter(e => e.sport.toLowerCase().includes(sport.toLowerCase()));
    }
    if (city && city !== 'All') {
      events = events.filter(e => e.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (status) {
      events = events.filter(e => e.status.toLowerCase() === status.toLowerCase());
    }
    if (featured !== undefined) {
      events = events.filter(e => e.featured === (featured === 'true'));
    }
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.tournament && e.tournament.toLowerCase().includes(q)) ||
        e.stadiumName.toLowerCase().includes(q) ||
        (e.teamA && e.teamA.name.toLowerCase().includes(q)) ||
        (e.teamB && e.teamB.name.toLowerCase().includes(q))
      );
    }

    if (sort === 'price_asc') events.sort((a, b) => a.basePrice - b.basePrice);
    else if (sort === 'price_desc') events.sort((a, b) => b.basePrice - a.basePrice);
    else events.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({ success: true, count: events.length, data: events });
  }
});

// @desc    Get event by ID with stadium stand details & live seat availability
// @route   GET /api/events/:id
// @access  Public
const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let event;
  let stadium;

  if (getMongoStatus()) {
    event = await Event.findById(id);
    if (event) {
      stadium = await Stadium.findById(event.stadiumId);
    }
  } else {
    event = memoryStore.getEventById(id);
    if (event) {
      stadium = memoryStore.getStadiumById(event.stadiumId);
    }
  }

  if (!event) {
    throw new ApiError(404, 'Match event not found');
  }

  res.status(200).json({
    success: true,
    data: {
      ...((event.toObject ? event.toObject() : event)),
      stadiumDetails: stadium || null
    }
  });
});

// @desc    Lock seats temporarily (10-minute hold for concurrency safety)
// @route   POST /api/events/:id/lock-seats
// @access  Private
const lockSeats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { seats = [] } = req.body;
  const userId = req.user.id || req.user._id;

  if (!seats || seats.length === 0) {
    throw new ApiError(400, 'No seats provided for locking');
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

  if (getMongoStatus()) {
    const event = await Event.findById(id);
    if (!event) throw new ApiError(404, 'Event not found');

    // Clean expired locks
    const now = new Date();
    event.seatLocks = (event.seatLocks || []).filter(lock => lock.expiresAt > now);

    // Check if any seat is already booked or locked by another user
    for (const seatId of seats) {
      if (event.bookedSeats && event.bookedSeats.includes(seatId)) {
        throw new ApiError(400, `Seat ${seatId} has already been purchased`);
      }
      const existingLock = event.seatLocks.find(l => l.seatId === seatId && l.userId !== userId);
      if (existingLock) {
        throw new ApiError(400, `Seat ${seatId} is currently held by another user`);
      }
    }

    // Add new locks
    for (const seatId of seats) {
      const idx = event.seatLocks.findIndex(l => l.seatId === seatId && l.userId === userId);
      if (idx !== -1) {
        event.seatLocks[idx].expiresAt = expiresAt;
      } else {
        event.seatLocks.push({ seatId, userId, expiresAt });
      }
    }

    await event.save();
    return res.status(200).json({
      success: true,
      message: 'Seats locked for 10 minutes',
      expiresAt
    });
  } else {
    const event = memoryStore.getEventById(id);
    if (!event) throw new ApiError(404, 'Event not found');

    const alreadyBooked = seats.some(s => event.bookedSeats && event.bookedSeats.includes(s));
    if (alreadyBooked) {
      throw new ApiError(400, 'One or more seats have already been purchased');
    }

    return res.status(200).json({
      success: true,
      message: 'Seats locked for 10 minutes',
      expiresAt
    });
  }
});

// @desc    Update live match score & status (Admin)
// @route   PUT /api/events/:id/live-score
// @access  Private/Admin
const updateLiveScore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { teamAScore, teamBScore, status, livePeriod } = req.body;

  let updated;
  const updateData = {
    'teamA.score': teamAScore,
    'teamB.score': teamBScore,
    status: status || 'Live',
    livePeriod: livePeriod || ''
  };

  if (getMongoStatus()) {
    updated = await Event.findByIdAndUpdate(id, { $set: updateData }, { new: true });
  } else {
    const event = memoryStore.getEventById(id);
    if (event) {
      if (teamAScore !== undefined) event.teamA.score = teamAScore;
      if (teamBScore !== undefined) event.teamB.score = teamBScore;
      if (status) event.status = status;
      if (livePeriod !== undefined) event.livePeriod = livePeriod;
      memoryStore.updateEvent(id, event);
      updated = event;
    }
  }

  if (!updated) throw new ApiError(404, 'Event not found');

  res.status(200).json({
    success: true,
    message: 'Live match score updated',
    data: updated
  });
});

// @desc    Create new match event
// @route   POST /api/events
// @access  Private/Admin
const createEvent = asyncHandler(async (req, res) => {
  const eventData = req.body;
  if (!eventData.title || !eventData.stadiumId || !eventData.date || !eventData.basePrice) {
    throw new ApiError(400, 'Title, Stadium, Date, and Base Price are required');
  }

  let created;
  if (getMongoStatus()) {
    created = await Event.create(eventData);
  } else {
    created = memoryStore.createEvent(eventData);
  }

  res.status(201).json({ success: true, data: created, message: 'Match event published successfully' });
});

// @desc    Update match event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let updated;

  if (getMongoStatus()) {
    updated = await Event.findByIdAndUpdate(id, req.body, { new: true });
  } else {
    updated = memoryStore.updateEvent(id, req.body);
  }

  if (!updated) throw new ApiError(404, 'Event not found');
  res.status(200).json({ success: true, data: updated, message: 'Event updated successfully' });
});

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let deleted;

  if (getMongoStatus()) {
    deleted = await Event.findByIdAndDelete(id);
  } else {
    deleted = memoryStore.deleteEvent(id);
  }

  if (!deleted) throw new ApiError(404, 'Event not found');
  res.status(200).json({ success: true, message: 'Event deleted successfully' });
});

module.exports = {
  getAllEvents,
  getEventById,
  lockSeats,
  updateLiveScore,
  createEvent,
  updateEvent,
  deleteEvent
};
