const mongoose = require('mongoose');

const addOnSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
}, { _id: false });

const splitBillSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  playerCount: { type: Number, default: 1 },
  perPersonShare: { type: Number, default: 0 },
  shareLink: { type: String, default: '' }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => 'bk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
  },
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  invoiceNumber: {
    type: String,
    default: () => 'INV-' + Math.floor(100000 + Math.random() * 900000)
  },
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['event', 'turf'],
    required: true
  },
  // Match / Event Details
  eventId: {
    type: String
  },
  eventTitle: {
    type: String
  },
  sport: {
    type: String
  },
  stadiumId: {
    type: String
  },
  stadiumName: {
    type: String,
    required: true
  },
  eventDate: {
    type: String
  },
  eventTime: {
    type: String
  },
  standName: {
    type: String
  },
  gateNumber: {
    type: String,
    default: 'Gate 4-North'
  },
  seats: [{
    type: String
  }],
  seatLabels: [{
    type: String
  }],
  // Turf Details
  turfOptionName: {
    type: String
  },
  bookingDate: {
    type: String
  },
  timeSlots: [{
    type: String
  }],
  durationHours: {
    type: Number,
    default: 1
  },
  // Split Bill info
  splitBill: splitBillSchema,
  // Financials
  addOns: [addOnSchema],
  ticketCount: {
    type: Number,
    default: 1
  },
  subTotal: {
    type: Number,
    required: true
  },
  addOnsTotal: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: '$'
  },
  paymentMethod: {
    type: String,
    default: 'Credit Card'
  },
  paymentTransactionId: {
    type: String,
    default: () => 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
    default: 'Paid'
  },
  bookingStatus: {
    type: String,
    enum: ['Confirmed', 'Cancelled', 'Completed'],
    default: 'Confirmed'
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelledAt: {
    type: Date
  },
  qrCodeData: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  _id: false
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
