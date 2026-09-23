const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Stadium = require('../models/Stadium');
const Booking = require('../models/Booking');
const SlotLock = require('../models/SlotLock');
const { decomposeSlotIntoHours } = require('../utils/time');

/**
 * Migration Script: Safely backfill SlotLock records for all existing active bookings.
 * 
 * Safety invariants:
 * - NEVER deletes or overwrites existing Booking documents.
 * - Only active bookings ('pending', 'confirmed', 'completed') receive locks.
 * - Cancelled or rejected bookings are strictly skipped.
 * - Idempotent: Can be run multiple times safely without creating duplicate locks.
 * - Detects and logs any existing data conflicts without silent corruption.
 */
const backfillSlotLocks = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking';
    console.log('\n========================================================');
    console.log('SLOTLOCK BACKFILL MIGRATION UTILITY');
    console.log('========================================================\n');
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.\n');

    // Ensure index exists first
    await SlotLock.verifyAndEnsureIndexes();

    const activeStatuses = ['pending', 'confirmed', 'completed'];

    console.log(`Fetching active bookings (${activeStatuses.join(', ')})...`);
    const activeBookings = await Booking.find({ status: { $in: activeStatuses } }).sort({ bookingDate: 1, startTime: 1 });
    console.log(`Found ${activeBookings.length} active booking(s) in database.\n`);

    let stats = {
      examined: activeBookings.length,
      alreadyLocked: 0,
      locksCreated: 0,
      bookingsProcessed: 0,
      skippedInvalidTimes: 0,
      conflictsEncountered: 0
    };

    for (const booking of activeBookings) {
      if (!booking.startTime || !booking.endTime) {
        console.warn(`[WARN] Booking ${booking._id} missing start/end times. Skipping.`);
        stats.skippedInvalidTimes++;
        continue;
      }

      const timeSlots = decomposeSlotIntoHours(booking.startTime, booking.endTime);
      if (!timeSlots || timeSlots.length === 0) {
        console.warn(`[WARN] Booking ${booking._id} has zero decomposed slots (${booking.startTime}-${booking.endTime}). Skipping.`);
        stats.skippedInvalidTimes++;
        continue;
      }

      // Check existing locks for this booking
      const existingLocks = await SlotLock.find({ booking: booking._id });
      if (existingLocks.length === timeSlots.length) {
        stats.alreadyLocked++;
        continue;
      }

      // Attempt to acquire missing locks
      let bookingLocked = true;
      for (const slot of timeSlots) {
        const lockExists = await SlotLock.findOne({
          stadium: booking.stadium,
          bookingDate: booking.bookingDate,
          timeSlot: slot
        });

        if (lockExists) {
          if (lockExists.booking.toString() === booking._id.toString()) {
            // Already owned by this booking
            continue;
          } else {
            console.error(`[CONFLICT] Stadium ${booking.stadium} on ${booking.bookingDate} at ${slot} is already locked by booking ${lockExists.booking}! Cannot lock for booking ${booking._id}.`);
            stats.conflictsEncountered++;
            bookingLocked = false;
            break;
          }
        }

        // Insert new lock record
        try {
          await SlotLock.create({
            stadium: booking.stadium,
            bookingDate: booking.bookingDate,
            timeSlot: slot,
            booking: booking._id,
            status: 'active'
          });
          stats.locksCreated++;
        } catch (err) {
          console.error(`[ERROR] Failed to insert lock for booking ${booking._id} at ${slot}: ${err.message}`);
          stats.conflictsEncountered++;
          bookingLocked = false;
          break;
        }
      }

      if (bookingLocked) {
        stats.bookingsProcessed++;
      }
    }

    console.log('\n========================================================');
    console.log('BACKFILL MIGRATION COMPLETE');
    console.log('========================================================');
    console.log(`- Total Active Bookings Examined: ${stats.examined}`);
    console.log(`- Bookings Already Fully Locked:  ${stats.alreadyLocked}`);
    console.log(`- Bookings Newly Processed:       ${stats.bookingsProcessed}`);
    console.log(`- SlotLock Records Created:       ${stats.locksCreated}`);
    console.log(`- Invalid Time Records Skipped:   ${stats.skippedInvalidTimes}`);
    console.log(`- Conflicts Encountered:          ${stats.conflictsEncountered}`);
    console.log('========================================================\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error(`Fatal migration error: ${error.message}`);
    process.exit(1);
  }
};

backfillSlotLocks();
