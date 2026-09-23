/**
 * Safe Test Data Cleanup for E2E Tests
 * STRICT SAFETY RULE:
 * Only documents matching E2E prefixes (^E2E_ or ^e2e_) are deleted.
 * NEVER deletes production-like records or executes empty deleteMany({}).
 */

const path = require('path');
const mongoose = require(path.join(__dirname, '../../backend/node_modules/mongoose'));
require(path.join(__dirname, '../../backend/node_modules/dotenv')).config({ path: path.join(__dirname, '../../backend/.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking';

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
}

async function cleanupE2EData() {
  await connectDB();

  const User = require('../../backend/models/User');
  const Stadium = require('../../backend/models/Stadium');
  const Booking = require('../../backend/models/Booking');
  const SlotLock = require('../../backend/models/SlotLock');
  const Payment = require('../../backend/models/Payment');
  const Notification = require('../../backend/models/Notification');
  const Review = require('../../backend/models/Review');
  const Favorite = require('../../backend/models/Favorite');
  const ContactMessage = require('../../backend/models/ContactMessage');

  // Find all E2E user IDs
  const e2eUsers = await User.find({
    $or: [
      { email: { $regex: /^e2e_/i } },
      { name: { $regex: /^E2E_/i } },
    ]
  }).select('_id');
  const userIds = e2eUsers.map(u => u._id);

  // Find all E2E stadium IDs
  const e2eStadiums = await Stadium.find({
    name: { $regex: /^E2E_/i }
  }).select('_id');
  const stadiumIds = e2eStadiums.map(s => s._id);

  // Find all E2E bookings
  const e2eBookings = await Booking.find({
    $or: [
      { user: { $in: userIds } },
      { stadium: { $in: stadiumIds } },
      { bookingReference: { $regex: /^E2E_/i } },
      { 'bookingFor.name': { $regex: /^E2E_/i } }
    ]
  }).select('_id');
  const bookingIds = e2eBookings.map(b => b._id);

  const results = {};

  // Clean slot locks for E2E bookings or stadiums
  if (bookingIds.length > 0 || stadiumIds.length > 0) {
    const slRes = await SlotLock.deleteMany({
      $or: [
        { booking: { $in: bookingIds } },
        { bookingId: { $in: bookingIds } },
        { stadium: { $in: stadiumIds } },
        { stadiumId: { $in: stadiumIds } }
      ]
    });
    results.slotLocksDeleted = slRes.deletedCount;
  }

  // Clean payments for E2E bookings or users
  if (bookingIds.length > 0 || userIds.length > 0) {
    const pRes = await Payment.deleteMany({
      $or: [
        { booking: { $in: bookingIds } },
        { bookingId: { $in: bookingIds } },
        { user: { $in: userIds } },
        { userId: { $in: userIds } }
      ]
    });
    results.paymentsDeleted = pRes.deletedCount;
  }

  // Clean notifications for E2E users
  if (userIds.length > 0) {
    const notifRes = await Notification.deleteMany({
      user: { $in: userIds }
    });
    results.notificationsDeleted = notifRes.deletedCount;
  }

  // Clean reviews by E2E users or for E2E stadiums
  if (userIds.length > 0 || stadiumIds.length > 0) {
    const revRes = await Review.deleteMany({
      $or: [
        { user: { $in: userIds } },
        { stadium: { $in: stadiumIds } }
      ]
    });
    results.reviewsDeleted = revRes.deletedCount;
  }

  // Clean favorites by E2E users or for E2E stadiums
  if (userIds.length > 0 || stadiumIds.length > 0) {
    const favRes = await Favorite.deleteMany({
      $or: [
        { user: { $in: userIds } },
        { stadium: { $in: stadiumIds } }
      ]
    });
    results.favoritesDeleted = favRes.deletedCount;
  }

  // Clean contacts with E2E prefix
  const conRes = await ContactMessage.deleteMany({
    $or: [
      { name: { $regex: /^E2E_/i } },
      { email: { $regex: /^e2e_/i } }
    ]
  });
  results.contactsDeleted = conRes.deletedCount;

  // Clean bookings
  if (bookingIds.length > 0) {
    const bRes = await Booking.deleteMany({ _id: { $in: bookingIds } });
    results.bookingsDeleted = bRes.deletedCount;
  }

  // Clean stadiums
  if (stadiumIds.length > 0) {
    const sRes = await Stadium.deleteMany({ _id: { $in: stadiumIds } });
    results.stadiumsDeleted = sRes.deletedCount;
  }

  // Clean users
  if (userIds.length > 0) {
    const uRes = await User.deleteMany({ _id: { $in: userIds } });
    results.usersDeleted = uRes.deletedCount;
  }

  return results;
}

module.exports = {
  cleanupE2EData,
};

if (require.main === module) {
  cleanupE2EData().then((res) => {
    console.log('Cleanup results:', res);
    process.exit(0);
  }).catch((err) => {
    console.error('Cleanup error:', err);
    process.exit(1);
  });
}
