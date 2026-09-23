const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a sport name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  icon: {
    type: String,
    default: 'Trophy',
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  defaultMinDuration: {
    type: Number,
    default: 1,
    min: [1, 'Minimum duration must be at least 1 hour']
  },
  defaultMaxDuration: {
    type: Number,
    default: 4,
    min: [1, 'Maximum duration must be at least 1 hour']
  },
  durationIncrement: {
    type: Number,
    default: 1,
    min: [1, 'Duration increment must be at least 1 hour']
  },
  minPlayers: {
    type: Number,
    default: 2,
    min: [1, 'Minimum players must be at least 1']
  },
  maxPlayers: {
    type: Number,
    default: 22,
    min: [1, 'Maximum players must be at least 1']
  },
  teamRequired: {
    type: Boolean,
    default: false
  },
  equipmentRentalAvailable: {
    type: Boolean,
    default: true
  },
  safetyRules: {
    type: [String],
    default: [
      'Proper sports gear and athletic footwear required on playing surface',
      'First aid kit available on site'
    ]
  },
  terms: {
    type: String,
    default: 'Participants must follow all facility and sport guidelines.'
  }
}, {
  timestamps: true
});

const Sport = mongoose.model('Sport', sportSchema);

module.exports = Sport;
