const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

const reconcile = async () => {
  const isRepairMode = process.argv.includes('--repair-safe');

  console.log('====================================================');
  console.log('      PAYMENT & BOOKING RECONCILIATION UTILITY      ');
  console.log(` Mode: ${isRepairMode ? '🔧 REPAIR-SAFE (Mutations Allowed)' : '🔍 REPORT-ONLY (Dry Run)'}`);
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  // 1. Find Paid Payments where Booking is not marked Paid
  const paidPayments = await Payment.find({ status: 'paid' }).lean();
  const mismatchedBookings = [];

  for (const payment of paidPayments) {
    const booking = await Booking.findById(payment.booking).lean();
    if (!booking) {
      mismatchedBookings.push({
        type: 'ORPHAN_PAID_PAYMENT',
        paymentId: payment._id,
        bookingId: payment.booking,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount
      });
    } else if (booking.paymentStatus !== 'paid') {
      mismatchedBookings.push({
        type: 'PAYMENT_PAID_BOOKING_UNPAID',
        paymentId: payment._id,
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        bookingStatus: booking.status,
        bookingPaymentStatus: booking.paymentStatus,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount
      });
    }
  }

  // 2. Find Bookings marked Paid without any paid Payment document
  const paidBookings = await Booking.find({ paymentStatus: 'paid' }).lean();
  const bookingsWithoutPaidPayment = [];

  for (const booking of paidBookings) {
    const hasPaidPayment = await Payment.findOne({
      booking: booking._id,
      status: 'paid'
    }).lean();

    if (!hasPaidPayment) {
      bookingsWithoutPaidPayment.push({
        type: 'BOOKING_PAID_NO_PAYMENT_DOC',
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        bookingStatus: booking.status
      });
    }
  }

  // 3. Find Stale Created/Pending Payments (> 24 hours old)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stalePayments = await Payment.find({
    status: { $in: ['created', 'pending'] },
    createdAt: { $lt: oneDayAgo }
  }).lean();

  // Summary Report
  console.log(`[1] Paid Payments with Unsynced Booking Payment Status: ${mismatchedBookings.length}`);
  mismatchedBookings.forEach(item => {
    console.log(`    - [${item.type}] Booking ${item.bookingReference || item.bookingId} (Current: ${item.bookingPaymentStatus}) <=> Payment ${item.paymentId} (Paid)`);
  });

  console.log(`\n[2] Bookings Marked Paid Without a Corresponding Paid Payment: ${bookingsWithoutPaidPayment.length}`);
  bookingsWithoutPaidPayment.forEach(item => {
    console.log(`    - [${item.type}] Booking ${item.bookingReference || item.bookingId}`);
  });

  console.log(`\n[3] Stale Created/Pending Payments (> 24h old): ${stalePayments.length}`);
  stalePayments.forEach(p => {
    console.log(`    - Payment ${p._id} (Order: ${p.razorpayOrderId}, Status: ${p.status}, Created: ${p.createdAt})`);
  });

  // Safe Repair Execution
  if (isRepairMode) {
    console.log('\n--- EXECUTING SAFE REPAIRS ---');
    let repairedBookings = 0;
    let cancelledStalePayments = 0;

    for (const item of mismatchedBookings) {
      if (item.type === 'PAYMENT_PAID_BOOKING_UNPAID') {
        await Booking.findByIdAndUpdate(item.bookingId, {
          $set: {
            paymentStatus: 'paid',
            status: item.bookingStatus === 'pending' ? 'confirmed' : item.bookingStatus
          }
        });
        console.log(`  ✓ Repaired Booking ${item.bookingId}: paymentStatus => 'paid'`);
        repairedBookings++;
      }
    }

    if (stalePayments.length > 0) {
      const res = await Payment.updateMany(
        {
          status: { $in: ['created', 'pending'] },
          createdAt: { $lt: oneDayAgo }
        },
        {
          $set: {
            status: 'cancelled',
            failureReason: 'Stale attempt cancelled by reconciliation'
          }
        }
      );
      cancelledStalePayments = res.modifiedCount;
      console.log(`  ✓ Cancelled ${cancelledStalePayments} stale payment attempts.`);
    }

    console.log(`\nRepair Summary: ${repairedBookings} bookings synced, ${cancelledStalePayments} stale payments cancelled.`);
  } else {
    console.log('\nDry run complete. No records were modified.');
    console.log('To apply safe repairs, run: node scripts/reconcilePayments.js --repair-safe');
  }

  await mongoose.disconnect();
  console.log('\n====================================================');
  process.exit(0);
};

reconcile().catch(err => {
  console.error('❌ Reconciliation failed:', err);
  process.exit(1);
});
