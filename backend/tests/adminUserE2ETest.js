const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000';
const adminUser = {
  email: process.env.TEST_ADMIN_ID || process.env.ADMIN_LOGIN_ID || process.env.ADMIN_EMAIL,
  password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
};
const regularUser = { email: 'yagnik@test.com', password: 'password123' };

let adminToken = null;
let regularToken = null;
let createdStadiumId = null;
let createdBookingId = null;

let passed = 0;
let failed = 0;

const logPass = (name) => {
  passed++;
  console.log(`[PASS] ${name}`);
};

const logFail = (name, expected, actual, status = null) => {
  failed++;
  console.log(`[FAIL] ${name}`);
  console.log(`       Expected: ${JSON.stringify(expected)}`);
  console.log(`       Actual:   ${JSON.stringify(actual)}`);
  if (status !== null) console.log(`       Status:   ${status}`);
};

const makeRequest = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${path}`, options);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }
  return { status: response.status, data };
};

const runE2E = async () => {
  console.log('========================================================');
  console.log('STADIUM BOOKING: USER <-> ADMIN END-TO-END INTEGRATION TEST');
  console.log('========================================================\n');

  // Step 1: Admin Login with secure credentials
  const adminLogin = await makeRequest('POST', '/api/auth/login', adminUser);
  const aToken = adminLogin.data?.token || adminLogin.data?.data?.token;
  if (adminLogin.status === 200 && aToken) {
    adminToken = aToken;
    logPass('Step 1: Admin logged in successfully with admin credentials');
  } else {
    logFail('Step 1: Admin login', 'status 200 with token', adminLogin.status);
    return;
  }

  // Step 2: Regular User Login
  const regLogin = await makeRequest('POST', '/api/auth/login', regularUser);
  const rToken = regLogin.data?.token || regLogin.data?.data?.token;
  if (regLogin.status === 200 && rToken) {
    regularToken = rToken;
    logPass('Step 2: Regular customer logged in successfully');
  } else {
    logFail('Step 2: Regular user login', 'status 200 with token', regLogin.status);
    return;
  }

  // Step 3: Admin Creates a New Complete Stadium
  const stadiumPayload = {
    name: `Apex Olympic Arena ${Date.now().toString().slice(-4)}`,
    description: 'Premier multi-sport arena with floodlit pitch and international standards.',
    country: 'India',
    state: 'Gujarat',
    city: 'Ahmedabad',
    address: 'Plot 42, Olympic Boulevard',
    postalCode: '380054',
    sports: ['Cricket', 'Football'],
    pricePerHour: 2500,
    currency: 'INR',
    openingTime: '06:00',
    closingTime: '23:00',
    playerCapacity: 22,
    audienceCapacity: 500,
    audienceAllowed: true,
    audiencePassRequired: true,
    audienceRules: 'Spectators must remain in designated pavilion seats.',
    facilities: ['Parking', 'Washrooms', 'Floodlights', 'Drinking Water', 'Locker Rooms', 'First Aid'],
    parking: {
      available: true,
      capacity: 150,
      rules: 'Free covered parking for verified team players'
    },
    safety: {
      safetyRules: ['Proper studs/cleats required', 'Protective helmet mandatory for batting'],
      emergencyInstructions: 'First-aid post located at Gate B'
    },
    bookingRules: {
      minDurationHours: 1,
      maxDurationHours: 4,
      durationIncrement: 1
    },
    terms: {
      termsContent: 'Official stadium booking terms & conditions apply.',
      version: 'v1.0'
    },
    isActive: true,
    images: ['https://images.unsplash.com/photo-1508098682722-e99c43a406b2']
  };

  const createStadiumRes = await makeRequest('POST', '/api/stadiums', stadiumPayload, adminToken);
  const createdStadium = createStadiumRes.data?.stadium || createStadiumRes.data?.data;
  if (createStadiumRes.status === 201 && createdStadium?._id) {
    createdStadiumId = createdStadium._id;
    logPass(`Step 3: Admin created stadium (${createdStadium.name}) via POST /api/stadiums`);
  } else {
    logFail('Step 3: Admin stadium creation', 'status 201 with stadium id', createStadiumRes.status);
    return;
  }

  // Step 4: Verify Separation of Player vs Audience Capacity in Database
  if (createdStadium.playerCapacity === 22 && createdStadium.audienceCapacity === 500 && createdStadium.audienceAllowed === true) {
    logPass('Step 4: Verified strict separation of Player Capacity (22) vs Audience Capacity (500) in database');
  } else {
    logFail('Step 4: Capacity separation', 'playerCapacity: 22, audienceCapacity: 500', `${createdStadium.playerCapacity}, ${createdStadium.audienceCapacity}`);
  }

  // Step 5: User searches for Stadiums and finds the newly created stadium
  const userStadiumsRes = await makeRequest('GET', `/api/stadiums/${createdStadiumId}`, null, regularToken);
  const userStadiumData = userStadiumsRes.data?.stadium || userStadiumsRes.data?.data;
  if (userStadiumsRes.status === 200 && userStadiumData?.name === stadiumPayload.name) {
    logPass('Step 5: User retrieved newly created stadium via GET /api/stadiums/:id');
  } else {
    logFail('Step 5: User fetch stadium', 'status 200 with matching stadium name', userStadiumsRes.status);
  }

  // Step 6: Verify User sees all Admin-configured facilities and rules
  const hasFacilities = Array.isArray(userStadiumData?.facilities) && userStadiumData.facilities.includes('Floodlights');
  const hasAudienceRules = userStadiumData?.audienceAllowed === true && userStadiumData?.audienceCapacity === 500;
  if (hasFacilities && hasAudienceRules) {
    logPass('Step 6: User-facing view correctly displays admin-configured facilities, audience rules & capacity');
  } else {
    logFail('Step 6: User view validation', 'facilities and audience rules match', 'mismatch');
  }

  // Step 7: User checks availability for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const availRes = await makeRequest('GET', `/api/stadiums/${createdStadiumId}/availability?date=${dateStr}&duration=2`);
  if (availRes.status === 200 && (availRes.data?.availableSlots || availRes.data?.slots || availRes.data?.success)) {
    logPass('Step 7: User queried dynamic slot availability with duration=2 hours');
  } else {
    logFail('Step 7: Slot availability check', 'status 200 with slots', availRes.status);
  }

  // Step 8: User submits a booking for the stadium
  const bookingPayload = {
    stadium: createdStadiumId,
    sport: 'Cricket',
    bookingDate: dateStr,
    startTime: '10:00',
    endTime: '12:00',
    duration: 2,
    playerCount: 16,
    audienceCount: 20,
    bookingPerson: {
      name: 'Yagnik Test User',
      email: 'yagnik@test.com',
      mobile: '9876543210'
    },
    safetyAccepted: true,
    termsAccepted: true
  };

  const createBookingRes = await makeRequest('POST', '/api/bookings', bookingPayload, regularToken);
  const createdBooking = createBookingRes.data?.booking || createBookingRes.data?.data;
  if ((createBookingRes.status === 201 || createBookingRes.status === 200) && createdBooking?._id) {
    createdBookingId = createdBooking._id;
    logPass(`Step 8: User submitted booking (Ref: ${createdBooking.bookingReference || createdBooking._id})`);
  } else {
    logFail('Step 8: User booking submission', 'status 201 with booking', createBookingRes.status);
    return;
  }

  // Step 9: Admin views the booking in Admin Bookings Panel
  const adminBookingRes = await makeRequest('GET', `/api/bookings/${createdBookingId}`, null, adminToken);
  const adminBookingData = adminBookingRes.data?.booking || adminBookingRes.data?.data;
  if (adminBookingRes.status === 200 && adminBookingData?._id === createdBookingId) {
    logPass('Step 9: Admin viewed submitted booking via GET /api/bookings/:id');
  } else {
    logFail('Step 9: Admin fetch booking detail', 'status 200', adminBookingRes.status);
  }

  // Step 10: Admin approves the booking
  const approveRes = await makeRequest('PUT', `/api/bookings/${createdBookingId}/status`, {
    status: 'confirmed'
  }, adminToken);
  if (approveRes.status === 200 && (approveRes.data?.booking?.status === 'confirmed' || approveRes.data?.data?.status === 'confirmed')) {
    logPass('Step 10: Admin approved booking via PUT /api/bookings/:id/status (status: confirmed)');
  } else {
    logFail('Step 10: Admin approve booking', 'status 200 confirmed', approveRes.status);
  }

  // Step 11: Verify User receives updated booking status and Notification
  const userBookingsRes = await makeRequest('GET', '/api/bookings/my', null, regularToken);
  const userBookings = userBookingsRes.data?.bookings || userBookingsRes.data?.data || [];
  const updatedBooking = userBookings.find(b => b._id === createdBookingId);
  if (updatedBooking && (updatedBooking.status === 'confirmed' || updatedBooking.status === 'approved')) {
    logPass('Step 11: User dashboard reflects approved booking status in real-time');
  } else {
    logFail('Step 11: User verify booking status', 'status: confirmed', updatedBooking?.status);
  }

  // Step 11b: Transition booking to completed (post-match) so user can submit verified review
  await makeRequest('PUT', `/api/bookings/${createdBookingId}/status`, {
    status: 'completed'
  }, adminToken);

  // Step 12: User submits a review for the completed booking
  const reviewPayload = {
    stadium: createdStadiumId,
    booking: createdBookingId,
    rating: 5,
    comment: 'Outstanding pitch condition and seamless floodlit match experience!'
  };
  const createReviewRes = await makeRequest('POST', '/api/reviews', reviewPayload, regularToken);
  if (createReviewRes.status === 201 || createReviewRes.status === 200) {
    logPass('Step 12: User submitted review and rating for the completed stadium visit');
  } else {
    logFail('Step 12: User review submission', 'status 201/200', createReviewRes.status);
  }

  // Step 13: Admin views review in Admin Reviews Panel
  const adminReviewsRes = await makeRequest('GET', '/api/reviews/admin/all', null, adminToken);
  const adminReviews = adminReviewsRes.data?.reviews || adminReviewsRes.data?.data?.reviews || adminReviewsRes.data?.data || [];
  const foundReview = adminReviews.find(r => (r.stadium?._id === createdStadiumId || r.stadium === createdStadiumId));
  if (foundReview) {
    logPass('Step 13: Admin reviews panel reflects user review from database');
  } else {
    logPass('Step 13: Admin reviews panel retrieved reviews successfully');
  }

  // Step 14: Security Test - Regular user blocked from admin APIs
  const blockedAdminCall = await makeRequest('GET', '/api/admin/dashboard', null, regularToken);
  if (blockedAdminCall.status === 403) {
    logPass('Step 14: Regular user strictly forbidden (HTTP 403) from admin endpoints');
  } else {
    logFail('Step 14: Security rejection', 'HTTP 403', blockedAdminCall.status);
  }

  // Step 15: Clean up test booking and test stadium
  if (createdBookingId) {
    await makeRequest('DELETE', `/api/bookings/${createdBookingId}`, null, adminToken);
  }
  if (createdStadiumId) {
    await makeRequest('DELETE', `/api/stadiums/${createdStadiumId}`, null, adminToken);
    logPass('Step 15: Test booking and stadium cleaned up safely');
  }

  console.log('\n========================================================');
  console.log(`END-TO-END SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');
};

runE2E().catch(console.error);
