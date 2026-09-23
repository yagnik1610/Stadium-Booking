const mongoose = require('mongoose');

const standSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  tier: { type: String, enum: ['VIP', 'Premium', 'Standard', 'Economy'], default: 'Standard' },
  priceMultiplier: { type: Number, default: 1.0 },
  rows: { type: Number, default: 6 },
  seatsPerRow: { type: Number, default: 16 },
  color: { type: String, default: '#3b82f6' },
  entryGate: { type: String, default: 'Gate A' },
  viewDescription: { type: String, default: 'Direct pitch-side view with central elevation' }
}, { _id: false });

const turfOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  sport: { type: String, default: 'Football' },
  size: { type: String, default: '100ft x 60ft' },
  surface: { type: String, default: '50mm FIFA Quality Monofilament AstroTurf' },
  ratePerHour: { type: Number, required: true },
  peakRatePerHour: { type: Number, default: 50 } // Prime evening & weekend rate
}, { _id: false });

const stadiumSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => 'stad_' + Date.now()
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'India'
  },
  address: {
    type: String,
    required: true
  },
  coordinates: {
    lat: { type: Number, default: 19.0760 },
    lng: { type: Number, default: 72.8777 }
  },
  sports: [{
    type: String,
    required: true
  }],
  venueType: {
    type: String,
    enum: ['Stadium', 'Turf', 'Arena', 'Complex'],
    default: 'Stadium'
  },
  capacity: {
    type: Number,
    default: 1000
  },
  rating: {
    type: Number,
    default: 4.8
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    required: true
  },
  gallery: [{
    type: String
  }],
  description: {
    type: String,
    default: ''
  },
  amenities: [{
    type: String
  }],
  operatingHours: {
    open: { type: String, default: '06:00 AM' },
    close: { type: String, default: '11:00 PM' }
  },
  hourlyRate: {
    type: Number,
    default: 30
  },
  peakHourlyRate: {
    type: Number,
    default: 45
  },
  currency: {
    type: String,
    default: '$'
  },
  stands: [standSchema],
  turfOptions: [turfOptionSchema]
}, {
  timestamps: true,
  _id: false
});

module.exports = mongoose.models.Stadium || mongoose.model('Stadium', stadiumSchema);
