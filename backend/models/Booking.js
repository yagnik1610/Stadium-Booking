const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  bookingReference: {
    type: String,
    unique: true,
    sparse: true // Allows legacy bookings without this field
  },
  bookingDate: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Please use a valid date format (YYYY-MM-DD)']
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use a valid time format (HH:mm) in 24-hour format']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please use a valid time format (HH:mm) in 24-hour format']
  },
  duration: {
    type: Number,
    required: true,
    min: [0.1, 'Duration must be positive']
  },
  pricePerHour: {
    type: Number,
    required: true,
    min: [0, 'Price per hour cannot be negative']
  },
  basePrice: {
    type: Number,
    min: [0, 'Base price cannot be negative']
  },
  gstRate: {
    type: Number,
    default: 18,
    min: [0, 'GST rate cannot be negative']
  },
  gstAmount: {
    type: Number,
    default: 0,
    min: [0, 'GST amount cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  bookingFor: {
    type: String,
    enum: ['myself', 'someone_else'],
    default: 'myself'
  },
  bookingPerson: {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    mobile: { type: String, trim: true },
    age: { type: Number },
    gender: { type: String, trim: true }
  },
  gameDetails: {
    matchType: { type: String, trim: true },
    teamName: { type: String, trim: true },
    playerCount: { type: Number },
    captainName: { type: String, trim: true },
    equipmentRental: { type: Boolean, default: false },
    playerNames: { type: [String], default: [] },
    ageGroup: { type: String, trim: true },
    additionalNotes: { type: String, trim: true },
    audienceCount: { type: Number, default: 0 },
    audiencePasses: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
    default: 'confirmed'
  },
  notes: {
    type: String,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  sport: {
    type: String,
    trim: true,
    default: ''
  },
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  safetyAcknowledged: {
    type: Boolean,
    default: false
  },
  termsAccepted: {
    type: Boolean,
    default: true
  },
  termsVersion: {
    type: String,
    default: '1.0'
  },
  termsAcceptedAt: {
    type: Date,
    default: Date.now
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});
// Pre-validate hook to generate readable unique bookingReference
bookingSchema.pre('validate', function (next) {
  if (!this.bookingReference) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingReference = `BK-${stamp}-${rand}`;
  }
  next();
});

// Add explicit indexes to support heavy lifecycle queries
bookingSchema.index({ user: 1 });
bookingSchema.index({ stadium: 1, bookingDate: 1 });
bookingSchema.index({ stadium: 1, bookingDate: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
