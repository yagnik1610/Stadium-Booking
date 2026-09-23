const mongoose = require('mongoose');

const slotLockSchema = new mongoose.Schema({
  stadium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stadium',
    required: true,
    index: true
  },
  bookingDate: {
    type: String,
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'],
    index: true
  },
  timeSlot: {
    type: String,
    required: true,
    match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time slot format (HH:mm)']
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'released'],
    default: 'active'
  }
}, {
  timestamps: true
});

// CRITICAL DATABASE-LEVEL CONCURRENCY CONSTRAINT
// Compound unique index guarantees that NO TWO active reservations can ever share the same hourly slot
slotLockSchema.index({ stadium: 1, bookingDate: 1, timeSlot: 1 }, { unique: true });

/**
 * Attempts to atomically acquire slot locks for a booking
 * Can be called with (stadiumId, bookingDate, timeSlots, bookingId)
 * or with ({ stadiumId, bookingDate, startTime, endTime, timeSlots, bookingId })
 * @returns {Promise<boolean>} True if all locks acquired, throws error if conflict
 */
slotLockSchema.statics.acquireLocks = async function(args, arg2, arg3, arg4) {
  let stadiumId, bookingDate, timeSlots, bookingId, startTime, endTime;

  if (typeof args === 'object' && args !== null && !arg2) {
    ({ stadiumId, bookingDate, timeSlots, bookingId, startTime, endTime } = args);
  } else {
    stadiumId = args;
    bookingDate = arg2;
    timeSlots = arg3;
    bookingId = arg4;
  }

  if (!timeSlots && startTime && endTime) {
    const { decomposeSlotIntoHours } = require('../utils/time');
    timeSlots = decomposeSlotIntoHours(startTime, endTime);
  }

  if (!timeSlots || timeSlots.length === 0) return true;

  const docs = timeSlots.map(timeSlot => ({
    stadium: stadiumId,
    bookingDate,
    timeSlot,
    booking: bookingId,
    status: 'active'
  }));

  try {
    await this.insertMany(docs, { ordered: true });
    return true;
  } catch (err) {
    // If any lock fails due to duplicate key (E11000), roll back any partial locks from this attempt
    await this.deleteMany({ booking: bookingId });
    const conflictError = new Error('The selected time slot is no longer available.');
    conflictError.status = 409;
    conflictError.statusCode = 409;
    conflictError.code = 11000;
    throw conflictError;
  }
};

/**
 * Releases all slot locks associated with a booking
 * @param {ObjectId} bookingId
 * @returns {Promise<number>} Number of released locks
 */
slotLockSchema.statics.releaseLocks = async function(bookingId) {
  const result = await this.deleteMany({ booking: bookingId });
  return result.deletedCount;
};

/**
 * Explicitly creates and verifies the compound unique index in MongoDB
 * Guarantees fail-safe production readiness
 */
slotLockSchema.statics.verifyAndEnsureIndexes = async function() {
  await this.syncIndexes();
  const indexes = await this.collection.indexes();
  const hasUniqueIndex = indexes.some(idx => 
    idx.unique && 
    idx.key &&
    idx.key.stadium === 1 && 
    idx.key.bookingDate === 1 && 
    idx.key.timeSlot === 1
  );
  if (!hasUniqueIndex) {
    throw new Error('Critical SlotLock unique compound index { stadium: 1, bookingDate: 1, timeSlot: 1 } is missing or not marked unique');
  }
  return true;
};

const SlotLock = mongoose.model('SlotLock', slotLockSchema);
SlotLock.createIndexes().catch(() => {});

module.exports = SlotLock;
