const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  businessName: {
    type: String,
    default: 'Stadium Booking Operations'
  },
  contactEmail: {
    type: String,
    default: 'support@stadiumbooking.com'
  },
  contactPhone: {
    type: String,
    default: '+91 9876543210'
  },
  defaultGstRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 28
  },
  currency: {
    type: String,
    default: 'INR'
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  cancellationCutoffHours: {
    type: Number,
    default: 24,
    min: 1
  },
  maxAdvanceBookingDays: {
    type: Number,
    default: 30,
    min: 1
  },
  termsVersion: {
    type: String,
    default: '1.0'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;
