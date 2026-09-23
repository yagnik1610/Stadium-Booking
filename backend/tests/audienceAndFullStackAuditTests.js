const fs = require('fs');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
const adminUser = { email: 'admin@stadium.com', password: 'admin12345' };
const testUser = {
  name: 'Test Athlete',
  email: `athlete_${Date.now()}@example.com`,
  password: 'Password123!',
  phone: '9876543210',
  city: 'Ahmedabad'
};

let adminToken = null;
let userToken = null;
let testStadiumId = null;
let noAudienceStadiumId = null;

let passed = 0;
let failed = 0;

const logPass = (name) => {
  passed++;
  console.log(`[PASS] ${name}`);
};

const logFail = (name, expected, actual, status = null, data = null) => {
  failed++;
  console.log(`[FAIL] ${name}`);
  console.log(`       Expected: ${expected}`);
  console.log(`       Actual:   ${actual}`);
  if (status) console.log(`       HTTP Status: ${status}`);
  if (data) console.log(`       Data: ${JSON.stringify(data)}`);
};

const makeRequest = async (method, endpoint, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }
  return { status: response.status, data };
};

const runSuite = async () => {
  console.log('===============================================================');
  console.log('AUDIENCE, PLAYER CAPACITY & FULL-STACK AUDIT TEST SUITE');
  console.log('===============================================================\n');

  // 1. Admin Login
  let res = await makeRequest('POST', '/api/auth/login', adminUser);
  if (res.status === 200 && res.data.token) {
    adminToken = res.data.token;
    logPass('Step 1: Admin authentication');
  } else {
    logFail('Step 1: Admin authentication', 'HTTP 200 with token', res.status);
    return;
  }

  // 2. User Registration & Login
  res = await makeRequest('POST', '/api/auth/register', testUser);
  if (res.status === 201 && res.data.token) {
    userToken = res.data.token;
    logPass('Step 2: User registration');
  } else {
    // Attempt login if user already exists
    res = await makeRequest('POST', '/api/auth/login', { email: testUser.email, password: testUser.password });
    if (res.status === 200 && res.data.token) {
      userToken = res.data.token;
      logPass('Step 2: User login');
    } else {
      logFail('Step 2: User auth', 'HTTP 200/201', res.status);
      return;
    }
  }

  // 3. Admin creates Stadium with configured Player and Audience Capacities (Section 18, 19, 20, 59)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const stadiumPayload = {
    name: `National Arena ${Date.now()}`,
    description: 'Premier sports facility with verified audience gallery and player turf.',
    location: 'Sports City East',
    address: 'Gate 4, Stadium Boulevard',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    sports: ['Cricket', 'Football'],
    capacity: 522,
    playerCapacity: 22,
    audienceCapacity: 500,
    audienceAllowed: true,
    audiencePassRequired: true,
    audienceRules: 'Spectators must enter through Gate 2 with verified digital pass.',
    pricePerHour: 2000,
    openingTime: '06:00',
    closingTime: '23:00',
    minDuration: 1,
    maxDuration: 4,
    allowedDurations: [1, 2, 3, 4],
    gstRate: 18,
    dimensions: { length: 110, width: 75, unit: 'm' },
    parking: { available: true, capacity: 150 },
    facilities: ['Floodlights', 'Changing Rooms', 'First Aid', 'Spectator Seating', 'CCTV Security']
  };

  res = await makeRequest('POST', '/api/stadiums', stadiumPayload, adminToken);
  if (res.status === 201 && res.data.stadium) {
    testStadiumId = res.data.stadium._id;
    if (
      res.data.stadium.playerCapacity === 22 &&
      res.data.stadium.audienceCapacity === 500 &&
      res.data.stadium.audienceAllowed === true &&
      res.data.stadium.audiencePassRequired === true
    ) {
      logPass('Step 3: Admin created stadium with playerCapacity=22, audienceCapacity=500, audienceAllowed=true, audiencePassRequired=true');
    } else {
      logFail('Step 3: Stadium capacity verification', 'capacities correctly set', JSON.stringify(res.data.stadium));
    }
  } else {
    logFail('Step 3: Create stadium', 'HTTP 201', res.status);
    return;
  }

  // 4. User queries Stadium via GET /api/stadiums/:id
  res = await makeRequest('GET', `/api/stadiums/${testStadiumId}`);
  if (
    res.status === 200 &&
    res.data.stadium.playerCapacity === 22 &&
    res.data.stadium.audienceCapacity === 500 &&
    res.data.stadium.audienceAllowed === true
  ) {
    logPass('Step 4: User receives real audience & player capacity configuration from MongoDB');
  } else {
    logFail('Step 4: GET stadium by ID', 'playerCapacity=22 & audienceCapacity=500', res.status);
  }

  // 5. Player Limit Test (Section 61): User submits 23 players -> Backend REJECTS (400)
  res = await makeRequest('POST', '/api/bookings', {
    stadiumId: testStadiumId,
    bookingDate: tomorrow,
    startTime: '10:00',
    duration: 2,
    sport: 'Cricket',
    bookingFor: 'myself',
    gameDetails: {
      playerCount: 23,
      audienceCount: 100
    }
  }, userToken);

  if (res.status === 400 && res.data.message?.includes('exceeds stadium player capacity')) {
    logPass('Step 5: Player limit test: 23 players on 22-player stadium is correctly REJECTED (HTTP 400)');
  } else {
    logFail('Step 5: Player limit test', 'HTTP 400 with player capacity message', res.status);
  }

  // 6. Audience Limit Test (Section 60): User submits 501 audience -> Backend REJECTS (400)
  res = await makeRequest('POST', '/api/bookings', {
    stadiumId: testStadiumId,
    bookingDate: tomorrow,
    startTime: '10:00',
    duration: 2,
    sport: 'Cricket',
    bookingFor: 'myself',
    gameDetails: {
      playerCount: 18,
      audienceCount: 501
    }
  }, userToken);

  if (res.status === 400 && res.data.message?.includes('exceeds stadium audience capacity')) {
    logPass('Step 6: Audience limit test: 501 spectators on 500-capacity arena is correctly REJECTED (HTTP 400)');
  } else {
    logFail('Step 6: Audience limit test', 'HTTP 400 with audience capacity message', res.status);
  }

  // 7. Valid Booking: 20 players + 50 audience -> Backend ALLOWS (201)
  let createdBookingId = null;
  res = await makeRequest('POST', '/api/bookings', {
    stadiumId: testStadiumId,
    bookingDate: tomorrow,
    startTime: '10:00',
    duration: 2,
    sport: 'Cricket',
    bookingFor: 'myself',
    gameDetails: {
      playerCount: 20,
      audienceCount: 50,
      captainName: 'Test Captain',
      teamName: 'Strikers XI'
    }
  }, userToken);

  if (res.status === 201 && res.data.booking) {
    createdBookingId = res.data.booking._id;
    const b = res.data.booking;
    if (b.gameDetails?.playerCount === 20 && b.gameDetails?.audienceCount === 50) {
      logPass('Step 7: Valid booking created: 20 players + 50 audience passes persisted in MongoDB');
    } else {
      logFail('Step 7: Booking gameDetails verification', 'playerCount=20, audienceCount=50', JSON.stringify(b.gameDetails));
    }
  } else {
    logFail('Step 7: Create valid booking', 'HTTP 201', res.status);
  }

  // 8. Audience Disallowed Test (Section 22):
  // Admin creates stadium with audienceAllowed = false
  const noAudiencePayload = {
    name: `Private Training Ground ${Date.now()}`,
    description: 'Closed training facility strictly for athletes.',
    location: 'North Zone',
    address: 'Private Road 1',
    city: 'Ahmedabad',
    sports: ['Football'],
    capacity: 22,
    playerCapacity: 22,
    audienceCapacity: 0,
    audienceAllowed: false,
    audiencePassRequired: false,
    pricePerHour: 1200,
    openingTime: '07:00',
    closingTime: '21:00',
    minDuration: 1,
    maxDuration: 2
  };

  res = await makeRequest('POST', '/api/stadiums', noAudiencePayload, adminToken);
  if (res.status === 201 && res.data.stadium) {
    noAudienceStadiumId = res.data.stadium._id;
    logPass('Step 8a: Admin created stadium with audienceAllowed=false');
  } else {
    logFail('Step 8a: Create closed stadium', 'HTTP 201', res.status);
  }

  // User attempts to book audience on closed stadium
  res = await makeRequest('POST', '/api/bookings', {
    stadiumId: noAudienceStadiumId,
    bookingDate: tomorrow,
    startTime: '14:00',
    duration: 1,
    sport: 'Football',
    bookingFor: 'myself',
    gameDetails: {
      playerCount: 14,
      audienceCount: 10
    }
  }, userToken);

  if (res.status === 400 && res.data.message?.includes('not permitted')) {
    logPass('Step 8b: Audience booking on audienceAllowed=false venue is correctly REJECTED (HTTP 400)');
  } else {
    logFail('Step 8b: Closed venue audience rejection', 'HTTP 400 with not permitted message', res.status);
  }

  // 9. Profile Edit & MongoDB Persistence (Section 48)
  const updatedProfile = {
    name: 'Yagnik Updated',
    mobile: '9898989898',
    city: 'Surat',
    state: 'Gujarat',
    country: 'India',
    age: 26,
    gender: 'Male'
  };

  res = await makeRequest('PUT', '/api/users/profile', updatedProfile, userToken);
  if (res.status === 200 && res.data.user?.city === 'Surat') {
    logPass('Step 9a: User profile updated via PUT /api/users/profile');
  } else {
    logFail('Step 9a: Profile update', 'HTTP 200 with updated city', res.status);
  }

  res = await makeRequest('GET', '/api/users/profile', null, userToken);
  if (res.status === 200 && res.data.user?.city === 'Surat' && res.data.user?.name === 'Yagnik Updated') {
    logPass('Step 9b: User profile verified persisted in MongoDB via GET /api/users/profile');
  } else {
    logFail('Step 9b: Profile persistence', 'HTTP 200 with saved values', res.status);
  }

  // 10. Notifications lifecycle (Section 47)
  res = await makeRequest('GET', '/api/notifications/my', null, userToken);
  if (res.status === 200 && Array.isArray(res.data.notifications)) {
    logPass(`Step 10a: GET /api/notifications/my returned ${res.data.notifications.length} real notifications`);
  } else {
    logFail('Step 10a: GET notifications', 'HTTP 200 array', res.status);
  }

  res = await makeRequest('GET', '/api/notifications/unread-count', null, userToken);
  if (res.status === 200 && typeof res.data.unreadCount === 'number') {
    logPass(`Step 10b: GET /api/notifications/unread-count returned ${res.data.unreadCount}`);
  } else {
    logFail('Step 10b: Unread notifications count', 'HTTP 200 number', res.status);
  }

  res = await makeRequest('PUT', '/api/notifications/read-all', {}, userToken);
  if (res.status === 200 && res.data.success === true) {
    logPass('Step 10c: PUT /api/notifications/read-all marked notifications as read');
  } else {
    logFail('Step 10c: Mark all notifications read', 'HTTP 200 success', res.status);
  }

  // 11. End-to-End Booking Lifecycle: Admin approval -> Payment verification -> Review
  if (createdBookingId) {
    // Admin approves booking
    res = await makeRequest('PUT', `/api/bookings/${createdBookingId}/status`, { status: 'confirmed' }, adminToken);
    if (res.status === 200 && res.data.booking?.status === 'confirmed') {
      logPass('Step 11a: Admin approves user booking');
    } else {
      logFail('Step 11a: Admin approve booking', 'HTTP 200 confirmed', res.status);
    }

    // Payment lifecycle (Section 43): Create Razorpay order then verify HMAC signature
    const orderRes = await makeRequest('POST', '/api/payments/create-order', { bookingId: createdBookingId }, userToken);
    if (orderRes.status === 200 && orderRes.data.payment?.razorpayOrderId) {
      const orderId = orderRes.data.payment.razorpayOrderId;
      const payId = `pay_test_${Date.now()}`;
      const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_1234567890';
      const signature = require('crypto').createHmac('sha256', secret).update(`${orderId}|${payId}`).digest('hex');

      res = await makeRequest('POST', '/api/payments/verify', {
        razorpay_order_id: orderId,
        razorpay_payment_id: payId,
        razorpay_signature: signature
      }, userToken);

      if (res.status === 200 && res.data.success) {
        logPass('Step 11b: Razorpay order created and HMAC SHA256 payment signature verified on backend; booking paymentStatus=paid');
      } else {
        logFail('Step 11b: Payment verification', 'HTTP 200 success', res.status, res.data);
      }
    } else {
      logFail('Step 11b: Payment create-order', 'HTTP 200 with orderId', orderRes.status, orderRes.data);
    }

    // Mark completed for review eligibility
    res = await makeRequest('PUT', `/api/bookings/${createdBookingId}/status`, { status: 'completed' }, adminToken);
    if (res.status === 200 && res.data.booking?.status === 'completed') {
      logPass('Step 11c: Booking status updated to completed');
    } else {
      logFail('Step 11c: Mark completed', 'HTTP 200 completed', res.status);
    }

    // Check review eligibility
    res = await makeRequest('GET', `/api/reviews/eligible-bookings/${testStadiumId}`, null, userToken);
    if (res.status === 200 && res.data.isEligible === true) {
      logPass('Step 11d: User detected as eligible to write review for completed booking');
    } else {
      logFail('Step 11d: Review eligibility', 'HTTP 200 isEligible=true', res.status);
    }

    // Submit Review with Rating, Text, and Photo (Section 45, 46)
    res = await makeRequest('POST', '/api/reviews', {
      stadium: testStadiumId,
      booking: createdBookingId,
      rating: 5,
      comment: 'Superb facility with excellent turf and spectator seating!',
      photo: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=600&q=80'
    }, userToken);

    if (res.status === 201 && res.data.review) {
      logPass('Step 11e: Review with rating=5, comment, and photo successfully saved to MongoDB');
    } else {
      logFail('Step 11e: Submit review', 'HTTP 201', res.status);
    }

    // Verify Review appears on Stadium
    res = await makeRequest('GET', `/api/reviews/stadium/${testStadiumId}`);
    if (res.status === 200 && res.data.reviews?.length > 0) {
      logPass(`Step 11f: Stadium reviews query returns ${res.data.reviews.length} review(s) for user display`);
    } else {
      logFail('Step 11f: Get stadium reviews', 'HTTP 200 with reviews', res.status);
    }
  }

  console.log('\n===============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================\n');
};

runSuite().catch(console.error);
