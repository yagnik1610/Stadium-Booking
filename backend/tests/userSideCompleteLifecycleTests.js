const mongoose = require('mongoose');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000/api';

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith('http') ? path : `${BASE_URL}${path}`);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = { raw: data }; }
        resolve({ status: res.statusCode, body: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

async function runTests() {
  console.log('====================================================');
  console.log('COMPLETE USER-SIDE & ADMIN INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  };

  const testId = Date.now();
  const testEmail = `athlete_${testId}@example.com`;
  const testPassword = 'Password123!';
  let userToken = null;
  let userId = null;
  let adminToken = null;
  let testStadium = null;
  let bookingId = null;
  let bookingRef = null;
  let notificationId = null;

  try {
    // 1. Register User with Multi-Country Location & International Phone
    const regRes = await request('POST', '/auth/register', {
      name: `Test Athlete ${testId}`,
      email: testEmail,
      password: testPassword,
      mobile: '+91 9876543210',
      age: 26,
      gender: 'Male',
      country: 'India',
      state: 'Gujarat',
      city: 'Ahmedabad'
    });

    assert(regRes.status === 201 && regRes.body.success, '1. User Registration with international format succeeds');
    userId = regRes.body.user?._id;

    // 2. Login User
    const loginRes = await request('POST', '/auth/login', {
      email: testEmail,
      password: testPassword
    });

    assert(loginRes.status === 200 && loginRes.body.token, '2. User Login returns valid JWT session token');
    userToken = loginRes.body.token;

    // 3. User Session Profile
    const profileRes = await request('GET', '/auth/profile', null, userToken);
    assert(profileRes.status === 200 && profileRes.body.user?.email === testEmail, '3. User session profile verified via GET /auth/profile');

    // 4. Admin Login
    const adminLoginRes = await request('POST', '/auth/login', {
      email: 'admin@stadium.com',
      password: 'admin12345'
    });

    assert(adminLoginRes.status === 200 && adminLoginRes.body.token, '4. Admin Login returns authorized admin token');
    adminToken = adminLoginRes.body.token;

    // 5. Query Active Stadiums from MongoDB
    const stadiumRes = await request('GET', '/stadiums');
    assert(stadiumRes.status === 200 && stadiumRes.body.stadiums?.length > 0, '5. Active stadiums catalog retrieved from MongoDB');
    testStadium = stadiumRes.body.stadiums[0];

    // 6. Check Slot Availability for future date (+8 days)
    const futureDateObj = new Date();
    futureDateObj.setDate(futureDateObj.getDate() + 8);
    const futureDate = futureDateObj.toISOString().split('T')[0];

    const availRes = await request('GET', `/stadiums/${testStadium._id}/availability?date=${futureDate}`);
    assert(availRes.status === 200 && Array.isArray(availRes.body.slots), '6. Live slot availability returns validated 1-hour slots');

    const availableSlot = availRes.body.slots.find(s => s.isAvailable || s.available);
    assert(!!availableSlot, '7. Found an available time slot for booking test');

    // 8. Create Dynamic Booking with Sport Parameters and Terms Acceptance
    const bookingRes = await request('POST', '/bookings', {
      stadium: testStadium._id,
      bookingDate: futureDate,
      startTime: availableSlot.startTime,
      endTime: availableSlot.endTime,
      sport: testStadium.sports?.[0] || 'Cricket',
      customFields: {
        players: 12,
        matchType: 'Friendly',
        equipmentRental: true
      },
      termsAccepted: true,
      termsVersion: '1.0'
    }, userToken);

    assert(bookingRes.status === 201 && bookingRes.body.booking, '8. Dynamic Booking created with customFields and terms');
    bookingId = bookingRes.body.booking?._id;
    bookingRef = bookingRes.body.booking?.bookingReference;

    // 9. Verify Booking in User's My Bookings
    const myBookingsRes = await request('GET', '/bookings/my', null, userToken);
    const foundBooking = myBookingsRes.body.bookings?.find(b => b._id === bookingId);
    assert(!!foundBooking && foundBooking.status === 'confirmed' || foundBooking?.status === 'pending', '9. Booking appears in User My Bookings with correct initial status');

    // 10. Verify Notification generated
    const notifRes = await request('GET', '/notifications/my', null, userToken);
    assert(notifRes.status === 200 && notifRes.body.notifications?.length > 0, '10. In-app notification generated for booking creation');
    notificationId = notifRes.body.notifications[0]._id;

    // 11. Mark Notification as Read
    const readRes = await request('PUT', `/notifications/${notificationId}/read`, {}, userToken);
    assert(readRes.status === 200 && readRes.body.notification?.isRead === true, '11. Notification mark as read works');

    // 12. Admin Updates Booking Status to Confirmed/Approved
    const updateRes = await request('PUT', `/bookings/${bookingId}/status`, {
      status: 'confirmed'
    }, adminToken);
    assert(updateRes.status === 200 && updateRes.body.booking?.status === 'confirmed', '12. Admin approves booking via PUT /bookings/:id/status');

    // 13. Create Payment Order via Razorpay API
    const orderRes = await request('POST', '/payments/create-order', {
      bookingId
    }, userToken);
    assert(orderRes.status === 200 && orderRes.body.payment?.razorpayOrderId, '13. Backend creates Razorpay order with server-calculated amount');

    const orderId = orderRes.body.payment.razorpayOrderId;
    const fakePaymentId = `pay_mock_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const mockSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${fakePaymentId}`)
      .digest('hex');

    // 14. Verify Payment with HMAC Signature
    const verifyRes = await request('POST', '/payments/verify', {
      bookingId,
      razorpay_order_id: orderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: mockSignature
    }, userToken);
    assert(verifyRes.status === 200 && verifyRes.body.success, '14. Payment verified via HMAC SHA-256 and marked paid in MongoDB');

    // 15. Verify Payment History
    const payHistoryRes = await request('GET', '/payments/my', null, userToken);
    const foundPayment = payHistoryRes.body.payments?.find(p => p.razorpayOrderId === orderId);
    assert(!!foundPayment && foundPayment.status === 'paid', '15. Payment record visible in Payment History');

    // 16. Admin Marks Booking as Completed (for review eligibility)
    const completeRes = await request('PUT', `/bookings/${bookingId}/status`, {
      status: 'completed'
    }, adminToken);
    assert(completeRes.status === 200 && completeRes.body.booking?.status === 'completed', '16. Admin marks booking completed');

    // 17. User Leaves Verified 5-Star Review
    const reviewRes = await request('POST', '/reviews', {
      stadium: testStadium._id,
      booking: bookingId,
      rating: 5,
      comment: 'Superb facility with pristine playing turf and floodlights!'
    }, userToken);
    assert(reviewRes.status === 201 && reviewRes.body.review?.rating === 5, '17. Review created on completed booking');

    // 18. User Adds Stadium to Favorites & Persists in MongoDB
    const favRes = await request('POST', '/favorites', {
      stadium: testStadium._id
    }, userToken);
    assert(favRes.status === 201 && favRes.body.favorite, '18. Stadium added to User Favorites in MongoDB');

    const checkFavRes = await request('GET', `/favorites/check/${testStadium._id}`, null, userToken);
    assert(checkFavRes.status === 200 && checkFavRes.body.isFavorite === true, '19. Favorite status confirmed via GET /favorites/check/:id');

    // 20. Update User Profile
    const updateProfileRes = await request('PUT', '/users/profile', {
      name: `Updated Athlete ${testId}`,
      city: 'Vadodara'
    }, userToken);
    assert(updateProfileRes.status === 200 && updateProfileRes.body.user?.city === 'Vadodara', '20. User profile update persists to MongoDB');

    // 21. Rejection Reason Test: Admin rejects a booking with reason
    const todaySlot = availRes.body.slots.find(s => s.isAvailable && s.startTime !== availableSlot.startTime);
    if (todaySlot) {
      const b2Res = await request('POST', '/bookings', {
        stadium: testStadium._id,
        bookingDate: futureDate,
        startTime: todaySlot.startTime,
        endTime: todaySlot.endTime,
        sport: testStadium.sports?.[0] || 'Football',
        termsAccepted: true
      }, userToken);

      if (b2Res.body.booking?._id) {
        const rejectRes = await request('PUT', `/bookings/${b2Res.body.booking._id}/status`, {
          status: 'cancelled',
          rejectionReason: 'Annual turf renovation'
        }, adminToken);

        assert(rejectRes.body.booking?.status === 'cancelled' && rejectRes.body.booking?.rejectionReason === 'Annual turf renovation', '21. Rejection reason recorded and stored in Booking record');
      }
    }

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
