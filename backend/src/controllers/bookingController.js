const { getMongoStatus } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Stadium = require('../models/Stadium');

// Helper to generate readable pass IDs
const generateBookingCode = (type) => {
  const prefix = type === 'event' ? 'PASS' : 'TURF';
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${num}`;
};

// @desc    Create a new booking (Match Ticket or Turf Slot)
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
  try {
    const {
      type,
      eventId,
      stadiumId,
      standName,
      seats = [],
      seatLabels = [],
      turfOptionName,
      bookingDate,
      timeSlots = [],
      durationHours = 1,
      addOns = [],
      subTotal,
      addOnsTotal = 0,
      tax = 0,
      discount = 0,
      totalAmount,
      currency = '$',
      paymentMethod = 'Credit Card'
    } = req.body;

    const userId = req.user.id || req.user._id;
    const userEmail = req.user.email;
    const userName = req.user.name;
    const bookingId = generateBookingCode(type);

    let eventDetails = null;
    let stadiumDetails = null;

    if (type === 'event') {
      if (!eventId || seats.length === 0) {
        return res.status(400).json({ success: false, message: 'Event ID and seat selection are required' });
      }

      if (getMongoStatus()) {
        eventDetails = await Event.findById(eventId);
        if (!eventDetails) return res.status(404).json({ success: false, message: 'Event not found' });

        // Check if any seat is already booked
        const alreadyBooked = seats.some(seat => eventDetails.bookedSeats && eventDetails.bookedSeats.includes(seat));
        if (alreadyBooked) {
          return res.status(400).json({ success: false, message: 'One or more selected seats have already been booked' });
        }

        // Lock seats
        eventDetails.bookedSeats = [...(eventDetails.bookedSeats || []), ...seats];
        await eventDetails.save();
      } else {
        eventDetails = memoryStore.getEventById(eventId);
        if (!eventDetails) return res.status(404).json({ success: false, message: 'Event not found' });

        const alreadyBooked = seats.some(seat => eventDetails.bookedSeats && eventDetails.bookedSeats.includes(seat));
        if (alreadyBooked) {
          return res.status(400).json({ success: false, message: 'One or more selected seats have already been booked' });
        }

        const updatedSeats = [...(eventDetails.bookedSeats || []), ...seats];
        memoryStore.updateEvent(eventId, { bookedSeats: updatedSeats });
      }
    } else if (type === 'turf') {
      if (!stadiumId || !bookingDate || timeSlots.length === 0) {
        return res.status(400).json({ success: false, message: 'Stadium ID, Date, and Time Slots are required' });
      }

      if (getMongoStatus()) {
        stadiumDetails = await Stadium.findById(stadiumId);
        if (!stadiumDetails) return res.status(404).json({ success: false, message: 'Turf venue not found' });
      } else {
        stadiumDetails = memoryStore.getStadiumById(stadiumId);
        if (!stadiumDetails) return res.status(404).json({ success: false, message: 'Turf venue not found' });
      }
    }

    // Generate QR code data payload
    const qrPayload = JSON.stringify({
      id: bookingId,
      u: userEmail,
      t: type,
      title: type === 'event' ? (eventDetails?.title || 'Match Ticket') : (stadiumDetails?.name || 'Turf Booking'),
      seats: type === 'event' ? seats.join(',') : undefined,
      slots: type === 'turf' ? timeSlots.join(',') : undefined,
      date: type === 'event' ? eventDetails?.date : bookingDate,
      ts: Date.now()
    });

    const bookingPayload = {
      bookingId,
      userId,
      userEmail,
      userName,
      type,
      eventId: type === 'event' ? eventId : undefined,
      eventTitle: type === 'event' ? eventDetails?.title : undefined,
      sport: type === 'event' ? eventDetails?.sport : (stadiumDetails?.sports?.[0] || 'Multi-Sport'),
      stadiumId: type === 'event' ? eventDetails?.stadiumId : stadiumId,
      stadiumName: type === 'event' ? eventDetails?.stadiumName : stadiumDetails?.name,
      eventDate: type === 'event' ? eventDetails?.date : undefined,
      eventTime: type === 'event' ? eventDetails?.time : undefined,
      standName: type === 'event' ? standName : undefined,
      seats: type === 'event' ? seats : [],
      seatLabels: type === 'event' ? seatLabels : [],
      turfOptionName: type === 'turf' ? turfOptionName : undefined,
      bookingDate: type === 'turf' ? bookingDate : undefined,
      timeSlots: type === 'turf' ? timeSlots : [],
      durationHours: type === 'turf' ? (durationHours || timeSlots.length) : undefined,
      addOns: addOns || [],
      ticketCount: type === 'event' ? seats.length : 1,
      subTotal: Number(subTotal) || 0,
      addOnsTotal: Number(addOnsTotal) || 0,
      tax: Number(tax) || 0,
      discount: Number(discount) || 0,
      totalAmount: Number(totalAmount) || 0,
      currency: currency || '$',
      paymentMethod: paymentMethod || 'Credit Card',
      paymentStatus: 'Paid',
      bookingStatus: 'Confirmed',
      qrCodeData: qrPayload
    };

    let savedBooking;
    if (getMongoStatus()) {
      savedBooking = await Booking.create(bookingPayload);
    } else {
      savedBooking = memoryStore.createBooking(bookingPayload);
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: savedBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Server error processing booking' });
  }
};

// @desc    Get logged in user's bookings
// @route   GET /api/bookings/my
// @access  Private
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    if (getMongoStatus()) {
      const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
      return res.json({ success: true, count: bookings.length, data: bookings });
    } else {
      const bookings = memoryStore.getBookingsByUserId(userId);
      return res.json({ success: true, count: bookings.length, data: bookings });
    }
  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving your bookings' });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    let booking;

    if (getMongoStatus()) {
      booking = await Booking.findById(id);
    } else {
      booking = memoryStore.getBookingById(id) || memoryStore.getBookings().find(b => b.bookingId === id);
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const userId = req.user.id || req.user._id;
    if (booking.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving booking' });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    let booking;

    if (getMongoStatus()) {
      booking = await Booking.findById(id);
    } else {
      booking = memoryStore.getBookingById(id) || memoryStore.getBookings().find(b => b.bookingId === id);
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const userId = req.user.id || req.user._id;
    if (booking.userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.bookingStatus === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    // Release seats if event booking
    if (booking.type === 'event' && booking.eventId && booking.seats && booking.seats.length > 0) {
      if (getMongoStatus()) {
        const event = await Event.findById(booking.eventId);
        if (event && event.bookedSeats) {
          event.bookedSeats = event.bookedSeats.filter(s => !booking.seats.includes(s));
          await event.save();
        }
      } else {
        const event = memoryStore.getEventById(booking.eventId);
        if (event && event.bookedSeats) {
          const newSeats = event.bookedSeats.filter(s => !booking.seats.includes(s));
          memoryStore.updateEvent(booking.eventId, { bookedSeats: newSeats });
        }
      }
    }

    // Update status
    if (getMongoStatus()) {
      booking.bookingStatus = 'Cancelled';
      booking.paymentStatus = 'Refunded';
      await booking.save();
    } else {
      booking = memoryStore.updateBooking(booking._id, {
        bookingStatus: 'Cancelled',
        paymentStatus: 'Refunded'
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled and refund processed',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling booking' });
  }
};

// @desc    Get booked turf slots for a venue & date
// @route   GET /api/bookings/turf-slots
// @access  Public
const getBookedTurfSlots = async (req, res) => {
  try {
    const { stadiumId, date } = req.query;
    if (!stadiumId || !date) {
      return res.status(400).json({ success: false, message: 'stadiumId and date are required' });
    }

    let bookings;
    if (getMongoStatus()) {
      bookings = await Booking.find({
        stadiumId,
        bookingDate: date,
        bookingStatus: 'Confirmed',
        type: 'turf'
      });
    } else {
      bookings = memoryStore.getBookings().filter(b => 
        b.type === 'turf' &&
        b.stadiumId === stadiumId &&
        b.bookingDate === date &&
        b.bookingStatus === 'Confirmed'
      );
    }

    const bookedSlots = [];
    bookings.forEach(b => {
      if (b.timeSlots && Array.isArray(b.timeSlots)) {
        bookedSlots.push(...b.timeSlots);
      }
    });

    res.json({ success: true, date, stadiumId, bookedSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error checking slot availability' });
  }
};

module.exports = { createBooking, getMyBookings, getBookingById, cancelBooking, getBookedTurfSlots };
