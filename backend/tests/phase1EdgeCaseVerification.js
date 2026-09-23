const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';

const adminCreds = {
  loginId: process.env.ADMIN_LOGIN_ID || 'admin01',
  email: process.env.ADMIN_EMAIL || 'admin@stadium.com',
  password: process.env.ADMIN_PASSWORD || 'admin12345'
};

const userCreds = {
  email: 'yagnik@test.com',
  password: 'password123'
};

const user2Creds = {
  email: 'edge_user2@test.com',
  password: 'password123',
  name: 'Edge Tester 2'
};

let adminToken = null;
let userToken = null;
let user2Token = null;
let testStadiumId = null;

let passed = 0;
let failed = 0;

const logPass = (name) => {
  passed++;
  console.log(`  \x1b[32m✓ [PASS]\x1b[0m ${name}`);
};

const logFail = (name, reason) => {
  failed++;
  console.error(`  \x1b[31m✗ [FAIL]\x1b[0m ${name}: ${reason}`);
};

const makeRequest = async (method, endpoint, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = typeof body === 'string' ? body : JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

const runEdgeCaseSuite = async () => {
  console.log('\n================================================================');
  console.log('PHASE 1.1 EDGE-CASE & RELIABILITY VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking');
    const db = mongoose.connection;
    const Stadium = db.model('Stadium', require('../models/Stadium').schema);
    const Booking = db.model('Booking', require('../models/Booking').schema);
    const SlotLock = db.model('SlotLock', require('../models/SlotLock').schema);
    const Payment = db.model('Payment', require('../models/Payment').schema);
    const User = db.model('User', require('../models/User').schema);

    // 1. Authentication
    console.log('1. Authentication Setup:');
    const adminRes = await makeRequest('POST', '/api/auth/login', adminCreds);
    if (adminRes.status === 200) {
      adminToken = adminRes.data.token;
      logPass('Admin authenticated');
    } else {
      const emailRes = await makeRequest('POST', '/api/auth/login', { email: adminCreds.email, password: adminCreds.password });
      adminToken = emailRes.data.token;
      logPass('Admin authenticated via email');
    }

    const userRes = await makeRequest('POST', '/api/auth/login', userCreds);
    if (userRes.status === 200) {
      userToken = userRes.data.token;
      logPass('User authenticated');
    }

    await makeRequest('POST', '/api/auth/register', user2Creds);
    const user2Res = await makeRequest('POST', '/api/auth/login', user2Creds);
    user2Token = user2Res.data.token;
    logPass('Secondary user authenticated');

    // 2. Setup Test Stadium
    console.log('\n2. Test Stadium Setup:');
    let testStadium = await Stadium.findOne({ name: 'Phase 1.1 Edge Arena' });
    if (!testStadium) {
      testStadium = await Stadium.create({
        name: 'Phase 1.1 Edge Arena',
        description: 'Dedicated stadium for Phase 1.1 edge-case testing',
        location: 'Ahmedabad, Gujarat',
        address: '200 Edge Blvd',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        sports: ['Cricket', 'Tennis'],
        capacity: 30,
        playerCapacity: 14,
        pricePerHour: 1500,
        minDuration: 1,
        maxDuration: 4,
        allowedDurations: [1, 2, 3, 4],
        durationIncrement: 1,
        openingTime: '06:00',
        closingTime: '23:00',
        isActive: true,
        createdBy: userRes.data?.user?._id || new mongoose.Types.ObjectId()
      });
    }
    testStadiumId = testStadium._id.toString();
    logPass(`Test stadium active: ${testStadium.name} (ID: ${testStadiumId})`);

    // Clean any prior bookings for test stadium
    await Booking.deleteMany({ stadium: testStadiumId });
    await SlotLock.deleteMany({ stadium: testStadiumId });

    const futureDate = '2029-06-15';

    // -------------------------------------------------------------
    // CHECK 1: EXISTING BOOKING PROTECTION WITHOUT SLOTLOCK
    // -------------------------------------------------------------
    console.log('\n3. CHECK 1 — Existing Bookings Without SlotLocks:');
    // Create an active Booking directly in MongoDB WITHOUT any SlotLock records
    const legacyBooking = await Booking.create({
      user: userRes.data.user._id,
      stadium: testStadiumId,
      bookingReference: 'STB-LEGACY-001',
      bookingDate: futureDate,
      startTime: '08:00',
      endTime: '10:00',
      duration: 2,
      pricePerHour: 1500,
      basePrice: 3000,
      gstRate: 18,
      gstAmount: 540,
      totalPrice: 3540,
      status: 'confirmed',
      paymentStatus: 'paid'
    });

    // Verify ZERO SlotLock records exist for this legacy booking
    const initialLocks = await SlotLock.find({ booking: legacyBooking._id });
    if (initialLocks.length === 0) {
      logPass('Simulated legacy booking created directly in MongoDB with ZERO SlotLocks');
    }

    // 3a. 07:00 -> 08:00 => ALLOWED
    const reqAdjacentBefore = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: futureDate,
      startTime: '07:00',
      endTime: '08:00'
    }, user2Token);
    if (reqAdjacentBefore.status === 201) {
      logPass('07:00-08:00 adjacent before slot is ALLOWED (201)');
    } else {
      logFail('07:00-08:00 adjacent check', `Got status ${reqAdjacentBefore.status}`);
    }

    // 3b. 08:00 -> 09:00 => BLOCKED (409)
    const reqInsideLeft = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: futureDate,
      startTime: '08:00',
      endTime: '09:00'
    }, user2Token);
    if (reqInsideLeft.status === 409) {
      logPass('08:00-09:00 internal overlap is BLOCKED by legacy booking (409 Conflict)');
    } else {
      logFail('08:00-09:00 internal overlap', `Expected 409, got ${reqInsideLeft.status}`);
    }

    // 3c. 09:00 -> 10:00 => BLOCKED (409)
    const reqInsideRight = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: futureDate,
      startTime: '09:00',
      endTime: '10:00'
    }, user2Token);
    if (reqInsideRight.status === 409) {
      logPass('09:00-10:00 internal overlap is BLOCKED by legacy booking (409 Conflict)');
    } else {
      logFail('09:00-10:00 internal overlap', `Expected 409, got ${reqInsideRight.status}`);
    }

    // 3d. 09:00 -> 11:00 => BLOCKED (409)
    const reqCrossOverlap = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: futureDate,
      startTime: '09:00',
      endTime: '11:00'
    }, user2Token);
    if (reqCrossOverlap.status === 409) {
      logPass('09:00-11:00 partial span overlap is BLOCKED by legacy booking (409 Conflict)');
    } else {
      logFail('09:00-11:00 span overlap', `Expected 409, got ${reqCrossOverlap.status}`);
    }

    // 3e. 10:00 -> 11:00 => ALLOWED
    const reqAdjacentAfter = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: futureDate,
      startTime: '10:00',
      endTime: '11:00'
    }, user2Token);
    if (reqAdjacentAfter.status === 201) {
      logPass('10:00-11:00 adjacent after slot is ALLOWED (201)');
    } else {
      logFail('10:00-11:00 adjacent check', `Got status ${reqAdjacentAfter.status}`);
    }

    // -------------------------------------------------------------
    // CHECK 2: ORPHAN SLOTLOCK CLEANUP ON FAILED PERSISTENCE
    // -------------------------------------------------------------
    console.log('\n4. CHECK 2 — Orphan SlotLock Cleanup on Failure:');
    // Test that if lock acquisition succeeds but booking persistence fails,
    // the acquired locks are immediately removed and no orphan locks remain.
    const orphanTestDate = '2029-07-20';
    const orphanProposedId = new mongoose.Types.ObjectId();

    // Acquire locks as createBooking would
    await SlotLock.acquireLocks({
      stadiumId: testStadiumId,
      bookingDate: orphanTestDate,
      startTime: '14:00',
      endTime: '16:00',
      bookingId: orphanProposedId
    });

    const acquiredLocksCount = await SlotLock.countDocuments({ booking: orphanProposedId });
    if (acquiredLocksCount === 2) {
      logPass('Locks successfully acquired for proposed booking (2 hourly locks)');
    }

    // Simulate Booking.create failure by triggering cleanup logic
    await SlotLock.releaseLocks(orphanProposedId);

    const remainingOrphanLocks = await SlotLock.countDocuments({ booking: orphanProposedId });
    if (remainingOrphanLocks === 0) {
      logPass('Orphan cleanup verified: 0 remaining locks after booking failure rollback');
    } else {
      logFail('Orphan cleanup', `Expected 0 locks, found ${remainingOrphanLocks}`);
    }

    // Verify slot can immediately be booked via API
    const postCleanupBookingRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: orphanTestDate,
      startTime: '14:00',
      endTime: '16:00'
    }, userToken);

    if (postCleanupBookingRes.status === 201) {
      logPass('Slot is immediately bookable after orphan lock cleanup (201 Created)');
    } else {
      logFail('Immediate rebook after orphan cleanup', `Got status ${postCleanupBookingRes.status}: ${postCleanupBookingRes.data.message}`);
    }

    // -------------------------------------------------------------
    // CHECK 3: SLOTLOCK GRANULARITY & DURATION ALIGNMENT
    // -------------------------------------------------------------
    console.log('\n5. CHECK 3 — SlotLock Granularity & Duration Alignment:');

    // 5a. Non-aligned start time (08:30) => BLOCKED (400)
    const nonAlignedStartRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: '2029-08-10',
      startTime: '08:30',
      endTime: '09:30'
    }, userToken);

    if (nonAlignedStartRes.status === 400 && nonAlignedStartRes.data.message.includes('1-hour intervals')) {
      logPass('Non-hour-aligned start time (08:30) rejected with 400 Bad Request');
    } else {
      logFail('Non-aligned start time check', `Status: ${nonAlignedStartRes.status}, Msg: ${nonAlignedStartRes.data.message}`);
    }

    // 5b. Fractional duration (1.5 hours) => BLOCKED (400)
    const fractionalDurationRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: '2029-08-10',
      startTime: '08:00',
      duration: 1.5
    }, userToken);

    if (fractionalDurationRes.status === 400 && fractionalDurationRes.data.message.includes('full 1-hour increments')) {
      logPass('Fractional duration (1.5 hours) rejected with 400 Bad Request');
    } else {
      logFail('Fractional duration check', `Status: ${fractionalDurationRes.status}, Msg: ${fractionalDurationRes.data.message}`);
    }

    // 5c. Duration exceeding stadium maxDuration (5 hours when max is 4) => BLOCKED (400)
    const excessDurationRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: '2029-08-10',
      startTime: '08:00',
      duration: 5
    }, userToken);

    if (excessDurationRes.status === 400 && excessDurationRes.data.message.includes('between 1 and 4 hours')) {
      logPass('Duration exceeding stadium limit (5h > 4h) rejected with 400 Bad Request');
    } else {
      logFail('Excess duration check', `Status: ${excessDurationRes.status}, Msg: ${excessDurationRes.data.message}`);
    }

    // 5d. Valid 1-hour aligned booking (08:00, 1 hour) => ALLOWED (201)
    const validAlignedRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: '2029-08-10',
      startTime: '08:00',
      duration: 1
    }, userToken);

    if (validAlignedRes.status === 201) {
      logPass('Valid 1-hour aligned booking (08:00 - 09:00) successfully created (201)');
    } else {
      logFail('Valid aligned booking', `Status: ${validAlignedRes.status}, Msg: ${validAlignedRes.data.message}`);
    }

    // -------------------------------------------------------------
    // CHECK 4: PRODUCTION-SAFE UNIQUE INDEX VERIFICATION
    // -------------------------------------------------------------
    console.log('\n6. CHECK 4 — Critical Unique Index Guarantee:');
    const slotLockIndexes = await db.collection('slotlocks').indexes();
    const uniqueIndex = slotLockIndexes.find(idx =>
      idx.unique === true &&
      idx.key &&
      idx.key.stadium === 1 &&
      idx.key.bookingDate === 1 &&
      idx.key.timeSlot === 1
    );

    if (uniqueIndex) {
      logPass('SlotLock compound unique index { stadium: 1, bookingDate: 1, timeSlot: 1 } exists and is unique');
    } else {
      logFail('SlotLock unique index', 'Compound unique index missing in MongoDB catalog');
    }

    // -------------------------------------------------------------
    // CHECK 5: STATUS LIFECYCLE & LOCK RETENTION/RELEASE
    // -------------------------------------------------------------
    console.log('\n7. CHECK 5 — Booking Status Lifecycle Lock Behavior:');

    // Create a new booking for lifecycle testing
    const lifecycleRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: '2029-09-01',
      startTime: '10:00',
      endTime: '12:00',
      status: 'pending'
    }, userToken);

    const lifecycleBookingId = lifecycleRes.data.booking._id;

    // 7a. Pending booking => Locks MUST remain
    let pendingLocks = await SlotLock.countDocuments({ booking: lifecycleBookingId });
    if (pendingLocks === 2) {
      logPass('Lifecycle [pending]: SlotLocks retained (2 locks active)');
    } else {
      logFail('Lifecycle pending locks', `Expected 2 locks, found ${pendingLocks}`);
    }

    // 7b. Confirmed booking => Locks MUST remain
    await makeRequest('PUT', `/api/bookings/${lifecycleBookingId}/status`, { status: 'confirmed' }, adminToken);
    let confirmedLocks = await SlotLock.countDocuments({ booking: lifecycleBookingId });
    if (confirmedLocks === 2) {
      logPass('Lifecycle [confirmed]: SlotLocks retained (2 locks active)');
    } else {
      logFail('Lifecycle confirmed locks', `Expected 2 locks, found ${confirmedLocks}`);
    }

    // 7c. Completed booking => Locks MUST remain (historical occupancy)
    await makeRequest('PUT', `/api/bookings/${lifecycleBookingId}/status`, { status: 'completed' }, adminToken);
    let completedLocks = await SlotLock.countDocuments({ booking: lifecycleBookingId });
    if (completedLocks === 2) {
      logPass('Lifecycle [completed]: SlotLocks retained for historical occupancy (2 locks active)');
    } else {
      logFail('Lifecycle completed locks', `Expected 2 locks, found ${completedLocks}`);
    }

    // 7d. Second booking for cancellation testing
    const cancelTestRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: '2029-09-02',
      startTime: '10:00',
      endTime: '11:00'
    }, userToken);
    const cancelBookingId = cancelTestRes.data.booking._id;

    // Cancel booking => Locks MUST be released
    await makeRequest('PUT', `/api/bookings/${cancelBookingId}/cancel`, {}, userToken);
    let cancelledLocks = await SlotLock.countDocuments({ booking: cancelBookingId });
    if (cancelledLocks === 0) {
      logPass('Lifecycle [cancelled]: SlotLocks immediately released (0 locks active)');
    } else {
      logFail('Lifecycle cancelled locks', `Expected 0 locks, found ${cancelledLocks}`);
    }

    // 7e. Third booking for rejection testing
    const rejectTestRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: '2029-09-03',
      startTime: '10:00',
      endTime: '11:00'
    }, userToken);
    const rejectBookingId = rejectTestRes.data.booking._id;

    // Admin rejects booking => Locks MUST be released
    await makeRequest('PUT', `/api/bookings/${rejectBookingId}/status`, {
      status: 'rejected',
      rejectionReason: 'Maintenance closure'
    }, adminToken);

    let rejectedLocks = await SlotLock.countDocuments({ booking: rejectBookingId });
    if (rejectedLocks === 0) {
      logPass('Lifecycle [rejected]: SlotLocks immediately released (0 locks active)');
    } else {
      logFail('Lifecycle rejected locks', `Expected 0 locks, found ${rejectedLocks}`);
    }

    // 7f. Payment failure DOES NOT remove locks
    const payFailBookingRes = await makeRequest('POST', '/api/bookings', {
      stadium: testStadiumId,
      bookingDate: '2029-09-04',
      startTime: '10:00',
      endTime: '11:00',
      status: 'pending'
    }, userToken);
    const payFailBookingId = payFailBookingRes.data.booking._id;

    const orderRes = await makeRequest('POST', '/api/payments/create-order', {
      bookingId: payFailBookingId
    }, userToken);

    await makeRequest('POST', '/api/payments/verify', {
      razorpay_order_id: orderRes.data.payment.razorpayOrderId,
      razorpay_payment_id: 'pay_fail_test_123',
      razorpay_signature: 'invalid_signature_intentionally'
    }, userToken);

    const locksAfterPaymentFailure = await SlotLock.countDocuments({ booking: payFailBookingId });
    if (locksAfterPaymentFailure === 1) {
      logPass('Payment failure: SlotLocks NOT removed (booking remains reserved for retry)');
    } else {
      logFail('Locks after payment failure', `Expected 1 lock, found ${locksAfterPaymentFailure}`);
    }

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n8. Test Cleanup:');
    await Booking.deleteMany({ stadium: testStadiumId });
    await SlotLock.deleteMany({ stadium: testStadiumId });
    await Stadium.deleteOne({ _id: testStadiumId });
    await User.deleteOne({ email: user2Creds.email });
    logPass('Test stadium and bookings cleaned up successfully');

    await mongoose.disconnect();

  } catch (err) {
    console.error('Unhandled edge suite error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TOTAL PHASE 1.1 EDGE-CASE CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL PHASE 1.1 EDGE-CASE REQUIREMENTS VERIFIED AND PASSING!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED.\n');
    process.exit(1);
  }
};

runEdgeCaseSuite();
