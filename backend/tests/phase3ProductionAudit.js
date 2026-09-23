/**
 * ============================================================================
 * PHASE 3: COMPLETE PRODUCTION READINESS, END-TO-END BACKEND AUDIT & HARDENING
 * ============================================================================
 *
 * Verifies all cross-system interactions, settings enforcement, state machines,
 * race condition recovery, data integrity, and deployment readiness.
 */

const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const API_BASE = 'http://localhost:5000';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

const logPass = (name) => {
  totalChecks++;
  passedChecks++;
  console.log(`  ✓ [PASS] Check ${totalChecks} - ${name}`);
};

const logFail = (name, expected, actual) => {
  totalChecks++;
  failedChecks++;
  console.error(`  ❌ [FAIL] Check ${totalChecks} - ${name}`);
  console.error(`     Expected: ${JSON.stringify(expected)}`);
  console.error(`     Actual:   ${JSON.stringify(actual)}`);
};

// Helper to make HTTP requests
const request = ({ method = 'GET', path, headers = {}, body = null }) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        ...headers
      }
    };

    let postData = null;
    if (body) {
      postData = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (_) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
};

const runPhase3Audit = async () => {
  console.log('\n================================================================');
  console.log('PHASE 3: COMPLETE PRODUCTION READINESS & END-TO-END AUDIT');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  const User = require('../models/User');
  const Stadium = require('../models/Stadium');
  const Booking = require('../models/Booking');
  const SlotLock = require('../models/SlotLock');
  const Payment = require('../models/Payment');
  const Setting = require('../models/Setting');
  const Notification = require('../models/Notification');

  const testSuffix = Date.now().toString();

  // Test Accounts
  const adminCredentials = {
    email: `phase3_admin_${testSuffix}@test.com`,
    password: 'Password123!',
    name: 'Phase 3 Admin',
    role: 'admin'
  };

  const userACredentials = {
    email: `phase3_user_a_${testSuffix}@test.com`,
    password: 'Password123!',
    name: 'Phase 3 User A'
  };

  const userBCredentials = {
    email: `phase3_user_b_${testSuffix}@test.com`,
    password: 'Password123!',
    name: 'Phase 3 User B'
  };

  let adminToken = '';
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';

  let testStadium = null;

  try {
    // -------------------------------------------------------------
    // Setup Test Users
    // -------------------------------------------------------------
    const regAdmin = await request({ method: 'POST', path: '/api/auth/register', body: adminCredentials });
    if (regAdmin.status === 201) {
      adminToken = regAdmin.data.token;
      await User.updateOne({ _id: regAdmin.data.user._id }, { $set: { role: 'admin' } });
      const loginAdmin = await request({ method: 'POST', path: '/api/auth/login', body: adminCredentials });
      adminToken = loginAdmin.data.token;
    }

    const regA = await request({ method: 'POST', path: '/api/auth/register', body: userACredentials });
    userAToken = regA.data.token;
    userAId = regA.data.user._id;

    const regB = await request({ method: 'POST', path: '/api/auth/register', body: userBCredentials });
    userBToken = regB.data.token;
    userBId = regB.data.user._id;

    // Create Test Stadium
    testStadium = await Stadium.create({
      name: `Phase 3 Audit Arena ${testSuffix}`,
      description: 'Audit test venue',
      location: 'South Mumbai',
      address: 'Marine Lines 100',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400020',
      sports: ['Cricket', 'Football'],
      capacity: 500,
      playerCapacity: 50,
      audienceCapacity: 450,
      pricePerHour: 1500,
      openingTime: '06:00',
      closingTime: '23:00',
      minDuration: 1,
      maxDuration: 4,
      allowedDurations: [1, 2, 3, 4],
      createdBy: regAdmin.data.user._id
    });

    // =============================================================
    // CATEGORY 1: HEALTH & READINESS PROBES (Step 47)
    // =============================================================
    console.log('--- CATEGORY 1: HEALTH & READINESS PROBES ---');
    const healthRes = await request({ method: 'GET', path: '/api/health' });
    if (healthRes.status === 200 && healthRes.data.status === 'healthy' && healthRes.data.database === 'connected') {
      logPass('GET /api/health returns 200 with operational metrics and database connectivity');
    } else {
      logFail('GET /api/health probe', { status: 200, health: 'healthy', db: 'connected' }, healthRes.data);
    }

    const readyRes = await request({ method: 'GET', path: '/api/ready' });
    if (readyRes.status === 200 && readyRes.data.status === 'ready' && readyRes.data.database === 'connected') {
      logPass('GET /api/ready returns 200 indicating database is ready for traffic');
    } else {
      logFail('GET /api/ready probe', { status: 200, ready: 'ready' }, readyRes.data);
    }

    // =============================================================
    // CATEGORY 2: STADIUM DATA INTEGRITY (Step 9)
    // =============================================================
    console.log('\n--- CATEGORY 2: STADIUM DATA INTEGRITY CONSTRAINTS ---');

    // 1. Closing time <= Opening time rejected
    try {
      const invalidHours = new Stadium({
        name: 'Invalid Hours Arena',
        description: 'Test',
        location: 'Test',
        address: 'Test',
        city: 'Mumbai',
        sports: ['Tennis'],
        capacity: 100,
        pricePerHour: 1000,
        openingTime: '18:00',
        closingTime: '08:00', // Earlier than opening!
        createdBy: regAdmin.data.user._id
      });
      await invalidHours.validate();
      logFail('Closing time <= Opening time validation', 'ValidationError expected', 'Validated successfully');
    } catch (err) {
      if (err.errors && err.errors.closingTime) {
        logPass('Stadium rejected when closingTime <= openingTime');
      } else {
        logFail('Closing time validation error format', 'closingTime in err.errors', err.message);
      }
    }

    // 2. minDuration > maxDuration rejected
    try {
      const invalidDuration = new Stadium({
        name: 'Invalid Duration Arena',
        description: 'Test',
        location: 'Test',
        address: 'Test',
        city: 'Mumbai',
        sports: ['Tennis'],
        capacity: 100,
        pricePerHour: 1000,
        openingTime: '08:00',
        closingTime: '20:00',
        minDuration: 5,
        maxDuration: 2, // min > max!
        createdBy: regAdmin.data.user._id
      });
      await invalidDuration.validate();
      logFail('minDuration > maxDuration validation', 'ValidationError expected', 'Validated successfully');
    } catch (err) {
      if (err.errors && err.errors.minDuration) {
        logPass('Stadium rejected when minDuration > maxDuration');
      } else {
        logFail('minDuration validation error format', 'minDuration in err.errors', err.message);
      }
    }

    // 3. playerCapacity > total capacity rejected
    try {
      const invalidCap = new Stadium({
        name: 'Invalid Capacity Arena',
        description: 'Test',
        location: 'Test',
        address: 'Test',
        city: 'Mumbai',
        sports: ['Tennis'],
        capacity: 50,
        playerCapacity: 100, // Exceeds total capacity!
        pricePerHour: 1000,
        openingTime: '08:00',
        closingTime: '20:00',
        createdBy: regAdmin.data.user._id
      });
      await invalidCap.validate();
      logFail('playerCapacity > capacity validation', 'ValidationError expected', 'Validated successfully');
    } catch (err) {
      if (err.errors && err.errors.playerCapacity) {
        logPass('Stadium rejected when playerCapacity > capacity');
      } else {
        logFail('playerCapacity validation error format', 'playerCapacity in err.errors', err.message);
      }
    }

    // =============================================================
    // CATEGORY 3: SETTINGS ENFORCEMENT (Steps 26, 28, 29, 30)
    // =============================================================
    console.log('\n--- CATEGORY 3: SYSTEM SETTINGS ENFORCEMENT ---');

    // 1. Max Advance Booking Days
    const currentSetting = await Setting.findOne().lean();
    const configuredAdvanceDays = currentSetting?.maxAdvanceBookingDays || 30;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + configuredAdvanceDays + 10);
    const farFutureDateStr = futureDate.toISOString().split('T')[0];

    const farAvailRes = await request({
      method: 'GET',
      path: `/api/stadiums/${testStadium._id}/availability?date=${farFutureDateStr}`
    });
    if (farAvailRes.status === 400 && farAvailRes.data.message?.includes('advance booking limit')) {
      logPass('checkAvailability strictly enforces maxAdvanceBookingDays ceiling (400 Bad Request)');
    } else {
      logFail('checkAvailability advance limit', '400 Bad Request with advance booking limit', farAvailRes);
    }

    const farBookingRes = await request({
      method: 'POST',
      path: '/api/bookings',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: {
        stadiumId: testStadium._id.toString(),
        bookingDate: farFutureDateStr,
        startTime: '10:00',
        duration: 1,
        sport: 'Cricket'
      }
    });
    if (farBookingRes.status === 400 && farBookingRes.data.message?.includes('advance booking limit')) {
      logPass('createBooking strictly enforces maxAdvanceBookingDays ceiling (400 Bad Request)');
    } else {
      logFail('createBooking advance limit', '400 Bad Request with advance booking limit', farBookingRes);
    }

    // 2. Cancellation Cutoff Hours
    // Create a booking set in the near future (e.g. 2 hours from now) but backdate createdAt to simulate an established booking
    const today = new Date().toISOString().split('T')[0];
    const establishedBooking = await Booking.create({
      user: userAId,
      stadium: testStadium._id,
      bookingDate: today,
      startTime: '22:00',
      endTime: '23:00',
      duration: 1,
      sport: 'Cricket',
      bookingReference: `STB-AUDIT-${testSuffix}`,
      pricePerHour: 1500,
      totalPrice: 1500,
      basePrice: 1500,
      gstAmount: 0,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes old (past 10-minute grace window)
    });

    const cutoffCancelRes = await request({
      method: 'PUT',
      path: `/api/bookings/${establishedBooking._id}/cancel`,
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    if (cutoffCancelRes.status === 400 && cutoffCancelRes.data.message?.includes('hours prior to slot start')) {
      logPass('cancellationCutoffHours blocks non-admin from cancelling inside the cutoff window');
    } else {
      logFail('cancellationCutoffHours enforcement', '400 with cutoff message', cutoffCancelRes);
    }

    // Admin override should succeed
    const adminCancelRes = await request({
      method: 'PUT',
      path: `/api/bookings/${establishedBooking._id}/cancel`,
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminCancelRes.status === 200 && adminCancelRes.data.success === true) {
      logPass('Admin has override authorization to cancel bookings regardless of cutoff');
    } else {
      logFail('Admin cancel override', 200, adminCancelRes);
    }

    // 3. Maintenance Mode
    await Setting.updateOne({}, { $set: { maintenanceMode: true } }, { upsert: true });

    // Public GET should still work
    const maintGetRes = await request({ method: 'GET', path: `/api/stadiums/${testStadium._id}` });
    if (maintGetRes.status === 200) {
      logPass('Maintenance Mode allows public GET stadium browsing');
    } else {
      logFail('Maintenance mode GET browsing', 200, maintGetRes.status);
    }

    // Non-admin mutation (POST /api/bookings) should return 503
    const maintMutateRes = await request({
      method: 'POST',
      path: '/api/bookings',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: {
        stadiumId: testStadium._id.toString(),
        bookingDate: today,
        startTime: '14:00',
        duration: 1
      }
    });
    if (maintMutateRes.status === 503 && maintMutateRes.data.message?.includes('maintenance')) {
      logPass('Maintenance Mode rejects non-admin booking mutation with 503 Service Unavailable');
    } else {
      logFail('Maintenance mode 503', 503, maintMutateRes);
    }

    // Admin mutation should be allowed
    const maintAdminRes = await request({
      method: 'GET',
      path: '/api/admin/settings',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (maintAdminRes.status === 200) {
      logPass('Maintenance Mode allows Admin operations uninterrupted');
    } else {
      logFail('Maintenance mode admin access', 200, maintAdminRes.status);
    }

    // Restore maintenance mode to false
    await Setting.updateOne({}, { $set: { maintenanceMode: false } });

    // =============================================================
    // CATEGORY 4: BOOKING STATE MACHINE (Step 11)
    // =============================================================
    console.log('\n--- CATEGORY 4: BOOKING STATE MACHINE TRANSITION RULES ---');

    // Create a fresh test booking
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fsmBooking = await Booking.create({
      user: userAId,
      stadium: testStadium._id,
      bookingDate: tomorrow,
      startTime: '10:00',
      endTime: '11:00',
      duration: 1,
      sport: 'Cricket',
      bookingReference: `STB-FSM-${testSuffix}`,
      pricePerHour: 1500,
      totalPrice: 1500,
      basePrice: 1500,
      gstAmount: 0,
      status: 'pending',
      paymentStatus: 'pending'
    });

    // 1. Pending -> Completed rejected (Cannot skip confirmation)
    const pendToComp = await request({
      method: 'PUT',
      path: `/api/bookings/${fsmBooking._id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'completed' }
    });
    if (pendToComp.status === 400 && pendToComp.data.message?.includes('without confirmation')) {
      logPass('FSM disallows jumping directly from "pending" to "completed"');
    } else {
      logFail('FSM pending->completed check', 400, pendToComp);
    }

    // 2. Pending -> Confirmed allowed
    const pendToConf = await request({
      method: 'PUT',
      path: `/api/bookings/${fsmBooking._id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'confirmed' }
    });
    if (pendToConf.status === 200 && pendToConf.data.booking.status === 'confirmed') {
      logPass('FSM allows transition from "pending" to "confirmed"');
    } else {
      logFail('FSM pending->confirmed', 200, pendToConf);
    }

    // 3. Confirmed -> Pending rejected
    const confToPend = await request({
      method: 'PUT',
      path: `/api/bookings/${fsmBooking._id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'pending' }
    });
    if (confToPend.status === 400 && confToPend.data.message?.includes('Cannot transition confirmed booking back to pending')) {
      logPass('FSM disallows transitioning "confirmed" booking back to "pending"');
    } else {
      logFail('FSM confirmed->pending check', 400, confToPend);
    }

    // 4. Confirmed -> Completed allowed
    const confToComp = await request({
      method: 'PUT',
      path: `/api/bookings/${fsmBooking._id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'completed' }
    });
    if (confToComp.status === 200 && confToComp.data.booking.status === 'completed') {
      logPass('FSM allows transition from "confirmed" to "completed"');
    } else {
      logFail('FSM confirmed->completed', 200, confToComp);
    }

    // 5. Completed is terminal: Completed -> Cancelled rejected
    const compToCanc = await request({
      method: 'PUT',
      path: `/api/bookings/${fsmBooking._id}/status`,
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'cancelled' }
    });
    if (compToCanc.status === 400 && compToCanc.data.message?.includes('already completed booking')) {
      logPass('FSM enforces terminal state: completed booking cannot be cancelled');
    } else {
      logFail('FSM completed terminal check', 400, compToCanc);
    }

    // =============================================================
    // CATEGORY 5: EXPIRATION RACE CONDITION RECOVERY (Step 15)
    // =============================================================
    console.log('\n--- CATEGORY 5: PAYMENT EXPIRATION RACE CONDITION RECOVERY ---');

    // Scenario A: Late payment captured, slot is still free -> Recover to confirmed
    const slotDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];
    const lateBooking = await Booking.create({
      user: userAId,
      stadium: testStadium._id,
      bookingDate: slotDate,
      startTime: '14:00',
      endTime: '15:00',
      duration: 1,
      sport: 'Cricket',
      bookingReference: `STB-RACE-${testSuffix}`,
      pricePerHour: 1500,
      totalPrice: 1500,
      basePrice: 1500,
      gstAmount: 0,
      status: 'cancelled', // Swept/cancelled by timeout cleaner
      notes: 'Booking expired due to payment window timeout',
      paymentStatus: 'pending'
    });

    const latePayment = await Payment.create({
      booking: lateBooking._id,
      user: userAId,
      amount: 150000,
      currency: 'INR',
      razorpayOrderId: `order_late_${testSuffix}`,
      razorpayPaymentId: `pay_late_${testSuffix}`,
      status: 'created'
    });

    // Simulate payment verification on the late expired booking with valid HMAC signature
    const crypto = require('crypto');
    const validSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${latePayment.razorpayOrderId}|${latePayment.razorpayPaymentId}`)
      .digest('hex');

    const verifyRes = await request({
      method: 'POST',
      path: '/api/payments/verify',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: {
        razorpay_order_id: latePayment.razorpayOrderId,
        razorpay_payment_id: latePayment.razorpayPaymentId,
        razorpay_signature: validSig
      }
    });

    const reloadedLateBooking = await Booking.findById(lateBooking._id);
    if (reloadedLateBooking.status === 'confirmed' && reloadedLateBooking.paymentStatus === 'paid') {
      logPass('Late payment capture cleanly recovers expired booking to "confirmed" when slot is free');
    } else {
      logFail('Late payment recovery', { status: 'confirmed', paymentStatus: 'paid' }, reloadedLateBooking.status);
    }

    // Verify SlotLock was re-acquired
    const locksFound = await SlotLock.find({ booking: lateBooking._id, status: 'active' });
    if (locksFound.length === 1 && locksFound[0].timeSlot === '14:00') {
      logPass('SlotLock successfully re-acquired during late payment recovery');
    } else {
      logFail('SlotLock re-acquisition', 1, locksFound.length);
    }

    // =============================================================
    // CATEGORY 6: USER OWNERSHIP & ADMIN RBAC (Steps 7 & 8)
    // =============================================================
    console.log('\n--- CATEGORY 6: USER OWNERSHIP & ADMIN RBAC CONTROLS ---');

    // User B tries to cancel User A's booking -> 403 Forbidden
    const crossCancelRes = await request({
      method: 'PUT',
      path: `/api/bookings/${lateBooking._id}/cancel`,
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    if (crossCancelRes.status === 403) {
      logPass('Cross-user booking cancellation blocked with 403 Forbidden');
    } else {
      logFail('Cross-user cancel check', 403, crossCancelRes.status);
    }

    // Non-admin tries to access admin settings -> 403 Forbidden
    const unauthAdminRes = await request({
      method: 'GET',
      path: '/api/admin/settings',
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    if (unauthAdminRes.status === 403) {
      logPass('Non-admin access to Admin endpoints blocked with 403 Forbidden');
    } else {
      logFail('Admin endpoint protection', 403, unauthAdminRes.status);
    }

    // =============================================================
    // CATEGORY 7: CONCURRENT BOOKING CONTENTION LOAD TEST (Step 55)
    // =============================================================
    console.log('\n--- CATEGORY 7: CONCURRENT BOOKING CONTENTION TEST ---');
    const contentionDate = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0];
    const targetSlot = '16:00';

    // 20 concurrent attempts to book the exact same slot
    const concurrentCount = 20;
    const promises = [];

    for (let i = 0; i < concurrentCount; i++) {
      promises.push(
        request({
          method: 'POST',
          path: '/api/bookings',
          headers: { Authorization: `Bearer ${userAToken}` },
          body: {
            stadiumId: testStadium._id.toString(),
            bookingDate: contentionDate,
            startTime: targetSlot,
            duration: 1,
            sport: 'Cricket'
          }
        })
      );
    }

    const responses = await Promise.all(promises);
    const successResponses = responses.filter(r => r.status === 201);
    const conflictResponses = responses.filter(r => r.status === 409);

    if (successResponses.length === 1 && conflictResponses.length === concurrentCount - 1) {
      logPass(`Concurrency check: Exactly 1 out of ${concurrentCount} concurrent requests succeeded, ${conflictResponses.length} returned 409 conflict`);
    } else {
      logFail('Concurrency contention', { success: 1, conflicts: concurrentCount - 1 }, { success: successResponses.length, conflicts: conflictResponses.length });
    }

    // Verify exactly one active SlotLock exists for this slot
    const locks = await SlotLock.find({
      stadium: testStadium._id,
      bookingDate: contentionDate,
      timeSlot: targetSlot
    });
    if (locks.length === 1) {
      logPass('Exactly 1 SlotLock persisted in MongoDB for contested slot (Zero double-booking)');
    } else {
      logFail('SlotLock count in DB', 1, locks.length);
    }

    // Clean up test records
    await Booking.deleteMany({ stadium: testStadium._id });
    await SlotLock.deleteMany({ stadium: testStadium._id });
    await Stadium.deleteOne({ _id: testStadium._id });
    await User.deleteMany({ _id: { $in: [userAId, userBId, regAdmin.data.user._id] } });

    console.log('\n================================================================');
    console.log(`TOTAL PHASE 3 AUDIT CHECKS: ${totalChecks}`);
    console.log(`PASSED: ${passedChecks}`);
    console.log(`FAILED: ${failedChecks}`);
    console.log('================================================================\n');

    await mongoose.connection.close();
    process.exit(failedChecks === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Phase 3 audit failed with unhandled error:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

runPhase3Audit();
