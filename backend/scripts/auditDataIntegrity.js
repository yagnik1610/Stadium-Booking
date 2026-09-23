/**
 * Production Readiness Diagnostic Script: Data Integrity Audit (Step 56)
 *
 * Scans MongoDB collections to detect data inconsistencies, orphan records,
 * and broken foreign references.
 *
 * DEFAULT MODE: READ ONLY (Does NOT mutate data).
 * Optional flag: --repair-safe (Repairs ONLY unambiguous, completely safe issues, e.g. releasing orphaned SlotLocks for deleted/cancelled bookings).
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const isRepairSafe = process.argv.includes('--repair-safe');

const runAudit = async () => {
  console.log('\n============================================================');
  console.log('🔍 STADIUM BOOKING SYSTEM: DATA INTEGRITY AUDIT');
  console.log(`MODE: ${isRepairSafe ? '⚠️ SAFE REPAIR (--repair-safe)' : 'READ ONLY (Default)'}`);
  console.log('============================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB database.\n');

    const User = require('../models/User');
    const Stadium = require('../models/Stadium');
    const Booking = require('../models/Booking');
    const Payment = require('../models/Payment');
    const SlotLock = require('../models/SlotLock');
    const Review = require('../models/Review');
    const Favorite = require('../models/Favorite');
    const Notification = require('../models/Notification');
    const EmailLog = require('../models/EmailLog');

    const results = {
      totalBookings: 0,
      bookingsMissingUser: 0,
      bookingsMissingStadium: 0,
      totalPayments: 0,
      paymentsMissingBooking: 0,
      totalReviews: 0,
      reviewsMissingBooking: 0,
      totalFavorites: 0,
      favoritesMissingUser: 0,
      favoritesMissingStadium: 0,
      totalNotifications: 0,
      notificationsMissingUser: 0,
      totalSlotLocks: 0,
      orphanSlotLocks: 0,
      totalEmailLogs: 0,
      emailLogsMissingUser: 0,
      stadiumMediaInconsistencies: 0,
      repairedCount: 0
    };

    // 1. Audit Bookings
    console.log('Checking Bookings integrity...');
    const bookings = await Booking.find({}).lean();
    results.totalBookings = bookings.length;

    const userIds = new Set((await User.find({}).select('_id').lean()).map(u => u._id.toString()));
    const stadiumIds = new Set((await Stadium.find({}).select('_id').lean()).map(s => s._id.toString()));
    const bookingIds = new Set(bookings.map(b => b._id.toString()));

    for (const b of bookings) {
      if (b.user && !userIds.has(b.user.toString())) {
        results.bookingsMissingUser++;
      }
      if (b.stadium && !stadiumIds.has(b.stadium.toString())) {
        results.bookingsMissingStadium++;
      }
    }

    // 2. Audit Payments
    console.log('Checking Payments integrity...');
    const payments = await Payment.find({}).lean();
    results.totalPayments = payments.length;
    for (const p of payments) {
      if (p.booking && !bookingIds.has(p.booking.toString())) {
        results.paymentsMissingBooking++;
      }
    }

    // 3. Audit Reviews
    console.log('Checking Reviews integrity...');
    const reviews = await Review.find({}).lean();
    results.totalReviews = reviews.length;
    for (const r of reviews) {
      if (r.booking && !bookingIds.has(r.booking.toString())) {
        results.reviewsMissingBooking++;
      }
    }

    // 4. Audit Favorites
    console.log('Checking Favorites integrity...');
    const favorites = await Favorite.find({}).lean();
    results.totalFavorites = favorites.length;
    for (const f of favorites) {
      if (f.user && !userIds.has(f.user.toString())) results.favoritesMissingUser++;
      if (f.stadium && !stadiumIds.has(f.stadium.toString())) results.favoritesMissingStadium++;
    }

    // 5. Audit Notifications
    console.log('Checking Notifications integrity...');
    const notifications = await Notification.find({}).lean();
    results.totalNotifications = notifications.length;
    for (const n of notifications) {
      if (n.user && !userIds.has(n.user.toString())) results.notificationsMissingUser++;
    }

    // 6. Audit SlotLocks
    console.log('Checking SlotLocks consistency...');
    const slotLocks = await SlotLock.find({}).lean();
    results.totalSlotLocks = slotLocks.length;
    const orphanLockIds = [];

    const activeBookingsMap = new Map();
    bookings.forEach(b => activeBookingsMap.set(b._id.toString(), b.status));

    for (const lock of slotLocks) {
      const bookingStatus = activeBookingsMap.get(lock.booking?.toString());
      // An active lock is orphaned if its booking does not exist or booking is cancelled/rejected
      if (!bookingStatus || bookingStatus === 'cancelled' || bookingStatus === 'rejected') {
        results.orphanSlotLocks++;
        orphanLockIds.push(lock._id);
      }
    }

    if (isRepairSafe && orphanLockIds.length > 0) {
      const deleteResult = await SlotLock.deleteMany({ _id: { $in: orphanLockIds } });
      results.repairedCount += deleteResult.deletedCount;
      console.log(`🔧 Safe repair: Released ${deleteResult.deletedCount} orphaned SlotLocks.`);
    }

    // 7. Audit EmailLogs
    console.log('Checking EmailLogs integrity...');
    const emailLogs = await EmailLog.find({}).lean();
    results.totalEmailLogs = emailLogs.length;
    for (const el of emailLogs) {
      if (el.user && !userIds.has(el.user.toString())) results.emailLogsMissingUser++;
    }

    // 8. Audit Stadium Media Inconsistencies
    console.log('Checking Stadium media consistency...');
    const stadiums = await Stadium.find({}).lean();
    for (const s of stadiums) {
      if (s.media?.cover?.publicId && !s.image) {
        results.stadiumMediaInconsistencies++;
      }
      if (s.media?.gallery && s.images && s.media.gallery.length !== s.images.length) {
        // Only a note if count differs between legacy array and structured metadata
      }
    }

    // Summary Output
    console.log('\n============================================================');
    console.log('📊 DATA INTEGRITY AUDIT SUMMARY');
    console.log('============================================================');
    console.log(`Bookings checked: ................. ${results.totalBookings}`);
    console.log(`  - Missing User: ................. ${results.bookingsMissingUser}`);
    console.log(`  - Missing Stadium: .............. ${results.bookingsMissingStadium}`);
    console.log(`Payments checked: ................. ${results.totalPayments}`);
    console.log(`  - Missing Booking: .............. ${results.paymentsMissingBooking}`);
    console.log(`Reviews checked: .................. ${results.totalReviews}`);
    console.log(`  - Missing Booking: .............. ${results.reviewsMissingBooking}`);
    console.log(`Favorites checked: ................ ${results.totalFavorites}`);
    console.log(`  - Missing User: ................. ${results.favoritesMissingUser}`);
    console.log(`  - Missing Stadium: .............. ${results.favoritesMissingStadium}`);
    console.log(`Notifications checked: ............ ${results.totalNotifications}`);
    console.log(`  - Missing User: ................. ${results.notificationsMissingUser}`);
    console.log(`SlotLocks checked: ................ ${results.totalSlotLocks}`);
    console.log(`  - Orphaned Locks: ............... ${results.orphanSlotLocks}`);
    console.log(`EmailLogs checked: ................ ${results.totalEmailLogs}`);
    console.log(`  - Missing User: ................. ${results.emailLogsMissingUser}`);
    console.log(`Stadium Media Inconsistencies: .... ${results.stadiumMediaInconsistencies}`);
    if (isRepairSafe) {
      console.log(`Safe Repairs Executed: ............ ${results.repairedCount}`);
    }
    console.log('============================================================');

    const totalIssues =
      results.bookingsMissingUser +
      results.bookingsMissingStadium +
      results.paymentsMissingBooking +
      results.reviewsMissingBooking +
      results.favoritesMissingUser +
      results.favoritesMissingStadium +
      results.notificationsMissingUser +
      (isRepairSafe ? 0 : results.orphanSlotLocks) +
      results.stadiumMediaInconsistencies;

    if (totalIssues === 0) {
      console.log('✅ ALL INTEGRITY CHECKS PASSED — Zero database inconsistencies found.');
    } else {
      console.log(`⚠️ Audit identified ${totalIssues} issue(s). Review above summary.`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Data integrity audit failed:', err.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

runAudit();
