const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const SlotLock = require('../models/SlotLock');
const User = require('../models/User');
const Stadium = require('../models/Stadium');
const { logPaymentEvent } = require('./paymentLogger');
const { sendBookingExpiredEmail } = require('./emailService');

/**
 * Sweeps and cancels stale pending bookings where payment was never initiated or completed.
 * Releases all SlotLock records to free the stadium time slot.
 *
 * @param {Object} options
 * @param {number} [options.timeoutMinutes] - Timeout in minutes (defaults to PAYMENT_PENDING_TIMEOUT_MINUTES or 15)
 * @returns {Promise<{ checked: number, expired: number, errors: number }>}
 */
const cleanupStalePendingBookings = async (options = {}) => {
  const timeoutMinutes = options.timeoutMinutes !== undefined
    ? options.timeoutMinutes
    : (parseInt(process.env.PAYMENT_PENDING_TIMEOUT_MINUTES, 10) || 15);

  const expiryThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

  const staleBookings = await Booking.find({
    status: 'pending',
    paymentStatus: 'pending',
    createdAt: { $lt: expiryThreshold }
  });

  let expiredCount = 0;
  let errorCount = 0;

  for (const booking of staleBookings) {
    try {
      // Atomic guard: only cancel if still pending and paymentStatus is pending
      const updatedBooking = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          status: 'pending',
          paymentStatus: 'pending'
        },
        {
          $set: {
            status: 'cancelled',
            notes: 'Booking expired due to payment window timeout'
          }
        },
        { new: true }
      );

      if (updatedBooking) {
        // Release SlotLocks so the slot can immediately be booked by others
        await SlotLock.releaseLocks(updatedBooking._id).catch(() => {});

        // Cancel any pending payment attempts
        await Payment.updateMany(
          {
            booking: updatedBooking._id,
            status: { $in: ['created', 'pending'] }
          },
          {
            $set: {
              status: 'cancelled',
              failureReason: 'Payment window expired'
            }
          }
        );

        expiredCount++;
        logPaymentEvent('BOOKING_EXPIRED_PAYMENT_TIMEOUT', {
          bookingId: updatedBooking._id,
          bookingReference: updatedBooking.bookingReference,
          timeoutMinutes
        });

        // Dispatch booking expired email asynchronously (failure-safe)
        Promise.all([
          User.findById(updatedBooking.user),
          Stadium.findById(updatedBooking.stadium)
        ]).then(([bookingUser, stadium]) => {
          if (bookingUser) {
            sendBookingExpiredEmail(updatedBooking, stadium, bookingUser).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch (err) {
      errorCount++;
      console.error(`❌ Failed to expire stale booking ${booking._id}:`, err.message);
    }
  }

  return {
    checked: staleBookings.length,
    expired: expiredCount,
    errors: errorCount
  };
};

let intervalHandle = null;

const startExpiryJob = (intervalMinutes = 5) => {
  if (intervalHandle) return;

  const intervalMs = intervalMinutes * 60 * 1000;
  intervalHandle = setInterval(async () => {
    try {
      await cleanupStalePendingBookings();
    } catch (err) {
      console.error('❌ Error during scheduled payment cleanup job:', err.message);
    }
  }, intervalMs);

  // Unref timer so it does not prevent Node.js from exiting cleanly
  if (intervalHandle.unref) {
    intervalHandle.unref();
  }

  console.log(`⏱️ Payment expiry cleanup job scheduled (every ${intervalMinutes} min)`);
};

const stopExpiryJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};

module.exports = {
  cleanupStalePendingBookings,
  startExpiryJob,
  stopExpiryJob
};
