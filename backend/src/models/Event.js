const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: '' },
  logo: { type: String, default: '🏆' },
  score: { type: String, default: '0' },
  color: { type: String, default: '#10b981' }
}, { _id: false });

const seatLockSchema = new mongoose.Schema({
  seatId: { type: String, required: true },
  userId: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => 'event_' + Date.now()
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  subTitle: {
    type: String,
    default: ''
  },
  sport: {
    type: String,
    required: true,
    enum: ['Cricket', 'Football', 'Basketball', 'Tennis', 'Badminton', 'Concerts', 'Other']
  },
  tournament: {
    type: String,
    default: ''
  },
  stadiumId: {
    type: String,
    required: true
  },
  stadiumName: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  doorsOpen: {
    type: String,
    default: ''
  },
  bannerImage: {
    type: String,
    required: true
  },
  teamA: teamSchema,
  teamB: teamSchema,
  basePrice: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: '$'
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Live', 'Completed', 'Cancelled'],
    default: 'Upcoming'
  },
  livePeriod: {
    type: String,
    default: '' // e.g. "1st Half - 34'", "2nd Innings - 14.2 Overs"
  },
  featured: {
    type: Boolean,
    default: false
  },
  weatherForecast: {
    temp: { type: String, default: '24°C' },
    condition: { type: String, default: 'Clear Skies' },
    windSpeed: { type: String, default: '12 km/h' }
  },
  referee: {
    type: String,
    default: 'Official Association Panel'
  },
  bookedSeats: [{
    type: String
  }],
  seatLocks: [seatLockSchema]
}, {
  timestamps: true,
  _id: false
});

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
