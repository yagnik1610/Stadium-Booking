const mongoose = require('mongoose');

const stadiumSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a stadium name'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a stadium description'],
  },
  location: {
    type: String,
    required: [true, 'Please provide the general location'],
  },
  address: {
    type: String,
    required: [true, 'Please provide the full address'],
  },
  city: {
    type: String,
    required: [true, 'Please provide the city'],
  },
  state: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
    default: 'India',
  },
  postalCode: {
    type: String,
    trim: true,
  },
  currency: {
    type: String,
    trim: true,
    default: 'INR',
  },
  sports: {
    type: [String],
    required: [true, 'Please provide at least one sport'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'A stadium must support at least one sport.'
    }
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide the stadium capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  playerCapacity: {
    type: Number,
    min: [1, 'Player capacity must be at least 1']
  },
  audienceCapacity: {
    type: Number,
    default: 0,
    min: [0, 'Audience capacity cannot be negative']
  },
  audienceAllowed: {
    type: Boolean,
    default: true
  },
  audiencePassRequired: {
    type: Boolean,
    default: false
  },
  audienceRules: {
    type: String,
    trim: true,
    default: ''
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Please provide the price per hour'],
    min: [0, 'Price per hour cannot be negative']
  },
  facilities: {
    type: [String],
    default: [],
  },
  image: {
    type: String,
    trim: true,
  },
  images: {
    type: [String],
    default: [],
  },
  media: {
    cover: {
      url: { type: String },
      secureUrl: { type: String },
      publicId: { type: String },
      resourceType: { type: String, default: 'image' },
      format: { type: String },
      width: { type: Number },
      height: { type: Number },
      bytes: { type: Number },
      originalName: { type: String }
    },
    gallery: [
      {
        url: { type: String },
        secureUrl: { type: String },
        publicId: { type: String },
        resourceType: { type: String, default: 'image' },
        format: { type: String },
        width: { type: Number },
        height: { type: Number },
        bytes: { type: Number },
        originalName: { type: String }
      }
    ]
  },
  contactNumber: {
    type: String,
  },
  openingTime: {
    type: String,
    required: [true, 'Please provide the opening time (e.g., "06:00")'],
  },
  closingTime: {
    type: String,
    required: [true, 'Please provide the closing time (e.g., "22:00")'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  bookingRequirements: [
    {
      fieldKey: { type: String, required: true },
      label: { type: String, required: true },
      fieldType: { type: String, default: 'text' },
      required: { type: Boolean, default: false },
      options: [String],
      min: Number,
      max: Number,
      placeholder: String
    }
  ],
  minDuration: {
    type: Number,
    default: 1,
    min: [1, 'Minimum booking duration must be at least 1 hour']
  },
  maxDuration: {
    type: Number,
    default: 4,
    min: [1, 'Maximum booking duration must be at least 1 hour']
  },
  allowedDurations: {
    type: [Number],
    default: [1, 2, 3, 4]
  },
  durationIncrement: {
    type: Number,
    default: 1
  },
  dimensions: {
    length: Number,
    width: Number,
    unit: { type: String, default: 'm' }
  },
  parking: {
    available: { type: Boolean, default: true },
    capacity: Number,
    details: String
  },
  facilityType: {
    type: String,
    default: 'Sports Complex'
  },
  gstRate: {
    type: Number,
    default: 0,
    min: [0, 'GST rate cannot be negative']
  },
  sportConfigurations: [
    {
      sport: { type: String, required: true },
      minDuration: Number,
      maxDuration: Number,
      allowedDurations: [Number],
      minPlayers: Number,
      maxPlayers: Number,
      teamRequired: Boolean,
      equipmentRentalAvailable: Boolean,
      safetyRules: [String],
      termsAndConditions: String,
      bookingInstructions: String,
      ageRestrictions: String
    }
  ],
  termsAndConditions: {
    type: String,
    default: '1. All participants must follow venue safety guidelines.\n2. Please arrive 15 minutes before your scheduled slot.\n3. Appropriate non-marking sports footwear is mandatory.\n4. Cancellations must be made at least 24 hours prior to the slot.'
  },
  termsVersion: {
    type: String,
    default: '1.0'
  },
  safetyRules: {
    type: [String],
    default: [
      'Proper sports gear and athletic shoes required',
      'First aid kit available on site with facility manager',
      'No food or glass containers permitted on the playing surface'
    ]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true
});

const { timeToMinutes } = require('../utils/time');

// Data Integrity Validations (Step 9)
stadiumSchema.pre('validate', function(next) {
  if (this.openingTime && this.closingTime) {
    try {
      const openMins = timeToMinutes(this.openingTime);
      const closeMins = timeToMinutes(this.closingTime);
      if (closeMins <= openMins) {
        this.invalidate('closingTime', 'closingTime must be later than openingTime');
      }
    } catch (_) {}
  }

  if (this.minDuration !== undefined && this.maxDuration !== undefined) {
    if (this.minDuration > this.maxDuration) {
      this.invalidate('minDuration', 'minDuration cannot be greater than maxDuration');
    }
  }

  if (this.allowedDurations && Array.isArray(this.allowedDurations) && this.allowedDurations.length > 0) {
    const min = this.minDuration !== undefined ? this.minDuration : 1;
    const max = this.maxDuration !== undefined ? this.maxDuration : 4;
    for (const d of this.allowedDurations) {
      if (d < min || d > max) {
        this.invalidate('allowedDurations', `Allowed duration ${d} is outside minDuration (${min}) and maxDuration (${max})`);
        break;
      }
    }
  }

  if (this.playerCapacity !== undefined && this.capacity !== undefined) {
    if (this.playerCapacity > this.capacity) {
      this.invalidate('playerCapacity', 'playerCapacity cannot exceed total capacity');
    }
  }

  next();
});

const Stadium = mongoose.model('Stadium', stadiumSchema);

module.exports = Stadium;

