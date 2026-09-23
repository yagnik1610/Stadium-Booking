const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phone: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  },
  bio: {
    type: String,
    default: 'Sports enthusiast & amateur footballer.'
  },
  favoriteSports: [{
    type: String
  }],
  notificationPrefs: {
    emailReceipts: { type: Boolean, default: true },
    matchReminders: { type: Boolean, default: true },
    promoDeals: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  _id: false
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
