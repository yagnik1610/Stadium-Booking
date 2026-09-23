const BASE_URL = 'http://localhost:5000';
const adminUser = { email: 'admin@stadium.com', password: 'admin12345' };
const regularUser = { email: 'yagnik@test.com', password: 'password123' };

let adminToken = null;
let regularToken = null;
let testStadiumId = null;

let passed = 0;
let failed = 0;

const logPass = (name) => {
  passed++;
  console.log(`[PASS] ${name}`);
};

const logFail = (name, expected, actual) => {
  failed++;
  console.log(`[FAIL] ${name}`);
  console.log(`       Expected: ${expected}`);
  console.log(`       Actual:   ${actual}`);
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

const getFutureDate = (offsetDays = 14) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const runTests = async () => {
  console.log('===========================================================');
  console.log('STADIUM DYNAMIC BOOKING ENGINE & GST FULL-STACK TEST SUITE');
  console.log('===========================================================\n');

  // 1. Auth
  let res = await makeRequest('POST', '/api/auth/login', regularUser);
  if (res.status === 200 && res.data?.token) {
    regularToken = res.data.token;
    logPass('Test 1 - User authentication');
  } else {
    logFail('Test 1 - User authentication', 'HTTP 200', res.status);
    return;
  }

  res = await makeRequest('POST', '/api/auth/login', adminUser);
  if (res.status === 200 && res.data?.token) {
    adminToken = res.data.token;
    logPass('Test 2 - Admin authentication');
  } else {
    logFail('Test 2 - Admin authentication', 'HTTP 200', res.status);
    return;
  }

  // 2. Create a Stadium with GST (18%), Min/Max Durations, Dimensions, Parking
  const stadiumPayload = {
    name: 'Metropolitan Sports Complex & Arena',
    description: 'Premier multi-sport facility featuring FIFA-grade artificial turf and cricket nets.',
    location: 'Satellite City',
    address: '100 Stadium Boulevard',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    sports: ['Football', 'Cricket', 'Tennis'],
    capacity: 50,
    pricePerHour: 1000,
    openingTime: '06:00',
    closingTime: '22:00',
    facilities: ['Floodlights', 'Changing Rooms', 'Parking', 'First Aid', 'Washrooms', 'Drinking Water'],
    minDuration: 1,
    maxDuration: 4,
    allowedDurations: [1, 2, 3, 4],
    gstRate: 18,
    dimensions: { length: 105, width: 68, unit: 'm' },
    parking: { available: true, capacity: 150, details: 'Covered parking with 24/7 CCTV surveillance' },
    isActive: true
  };

  res = await makeRequest('POST', '/api/stadiums', stadiumPayload, adminToken);
  if (res.status === 201 && res.data?.stadium?._id) {
    testStadiumId = res.data.stadium._id;
    logPass('Test 3 - Create stadium with GST, dimensions, parking, and duration config');
  } else {
    logFail('Test 3 - Create stadium', 'HTTP 201', res.status);
    return;
  }

  // 3. Test Availability with Dynamic Duration
  const testDate = getFutureDate(10);

  // 3a. 1-Hour Duration
  res = await makeRequest('GET', `/api/stadiums/${testStadiumId}/availability?date=${testDate}&duration=1`);
  if (res.status === 200 && res.data.success && res.data.slots.length > 0) {
    const firstSlot = res.data.slots[0];
    const lastSlot = res.data.slots[res.data.slots.length - 1];
    if (firstSlot.startTime === '06:00' && firstSlot.endTime === '07:00' && lastSlot.endTime === '22:00') {
      logPass('Test 4 - 1-hour availability slots respect opening (06:00) and closing (22:00)');
    } else {
      logFail('Test 4 - 1-hour availability boundaries', '06:00-07:00 to 21:00-22:00', `${firstSlot.startTime}-${firstSlot.endTime} to ${lastSlot.endTime}`);
    }
  } else {
    logFail('Test 4 - 1-hour availability', 'HTTP 200', res.status);
  }

  // 3b. 3-Hour Duration: Latest valid start must be 19:00 (19:00 + 3h = 22:00)
  res = await makeRequest('GET', `/api/stadiums/${testStadiumId}/availability?date=${testDate}&duration=3`);
  if (res.status === 200 && res.data.success && res.data.slots.length > 0) {
    const lastSlot = res.data.slots[res.data.slots.length - 1];
    if (lastSlot.startTime === '19:00' && lastSlot.endTime === '22:00') {
      logPass('Test 5 - 3-hour duration calculates latest valid start time as 19:00 (ends 22:00)');
    } else {
      logFail('Test 5 - 3-hour latest start', '19:00-22:00', `${lastSlot.startTime}-${lastSlot.endTime}`);
    }
  } else {
    logFail('Test 5 - 3-hour duration availability', 'HTTP 200', res.status);
  }

  // 4. Test Duration Validation on Availability
  res = await makeRequest('GET', `/api/stadiums/${testStadiumId}/availability?date=${testDate}&duration=6`);
  if (res.status === 400 && res.data.message.includes('between 1 and 4')) {
    logPass('Test 6 - Exceeding maximum duration (6 hours) rejected with validation message');
  } else {
    logFail('Test 6 - Maximum duration check', 'HTTP 400', res.status);
  }

  // 5. Create Booking for Someone Else with GST Billing Calculation
  // Base = 3 hours * 1000 = ₹3000, GST (18%) = ₹540, Total = ₹3540
  const bookingPayload = {
    stadium: testStadiumId,
    bookingDate: testDate,
    startTime: '16:00',
    duration: 3,
    sport: 'Football',
    bookingFor: 'someone_else',
    bookingPerson: {
      name: 'Rahul Patel',
      email: 'rahul.patel@example.com',
      mobile: '+91 9876543210',
      age: 28,
      gender: 'Male'
    },
    gameDetails: {
      teamName: 'Gujarat Strikers',
      matchType: '7v7 Match',
      playerCount: 14,
      captainName: 'Rahul Patel',
      equipmentRental: true
    },
    safetyAcknowledged: true,
    termsAccepted: true
  };

  let bookingId = null;
  res = await makeRequest('POST', '/api/bookings', bookingPayload, regularToken);
  if (res.status === 201 && res.data?.booking) {
    const b = res.data.booking;
    bookingId = b._id;
    if (b.duration === 3 && b.endTime === '19:00') {
      logPass('Test 7 - Server calculates authoritative end time (16:00 + 3h = 19:00)');
    } else {
      logFail('Test 7 - Authoritative end time', '19:00', b.endTime);
    }

    if (b.basePrice === 3000 && b.gstRate === 18 && b.gstAmount === 540 && b.totalPrice === 3540) {
      logPass('Test 8 - Server-side GST calculation verified (Base: ₹3000, 18% GST: ₹540, Total: ₹3540)');
    } else {
      logFail('Test 8 - GST calculation', 'Base: 3000, GST: 540, Total: 3540', `Base: ${b.basePrice}, GST: ${b.gstAmount}, Total: ${b.totalPrice}`);
    }

    if (b.bookingFor === 'someone_else' && b.bookingPerson?.name === 'Rahul Patel' && b.bookingPerson?.mobile === '+91 9876543210') {
      logPass('Test 9 - Nominee booking details persisted without altering account owner identity');
    } else {
      logFail('Test 9 - Nominee booking details', 'Rahul Patel / +91 9876543210', JSON.stringify(b.bookingPerson));
    }
  } else {
    logFail('Test 7-9 - Booking creation with nominee and GST', 'HTTP 201', res.status);
  }

  // 6. Test Multi-Hour Overlap Prevention
  // Trying to book 17:00 to 19:00 on the same date should be rejected (overlaps 16:00-19:00)
  res = await makeRequest('POST', '/api/bookings', {
    stadium: testStadiumId,
    bookingDate: testDate,
    startTime: '17:00',
    duration: 2,
    termsAccepted: true
  }, regularToken);
  if (res.status === 409) {
    logPass('Test 10 - Server rejects overlapping booking attempt (17:00-19:00 conflicts with 16:00-19:00)');
  } else {
    logFail('Test 10 - Overlap prevention', 'HTTP 409', res.status);
  }

  // 7. Verify Availability Endpoint blocks all slots overlapping 16:00-19:00
  res = await makeRequest('GET', `/api/stadiums/${testStadiumId}/availability?date=${testDate}&duration=1`);
  if (res.status === 200) {
    const slot15 = res.data.slots.find(s => s.startTime === '15:00');
    const slot16 = res.data.slots.find(s => s.startTime === '16:00');
    const slot17 = res.data.slots.find(s => s.startTime === '17:00');
    const slot18 = res.data.slots.find(s => s.startTime === '18:00');
    const slot19 = res.data.slots.find(s => s.startTime === '19:00');

    if (slot15?.available && !slot16?.available && !slot17?.available && !slot18?.available && slot19?.available) {
      logPass('Test 11 - Availability slots correctly marked unavailable for 16:00, 17:00, 18:00 while 15:00 & 19:00 remain free');
    } else {
      logFail('Test 11 - Slot availability masking', '16-18 unavailable, 15 & 19 available', `15:${slot15?.available}, 16:${slot16?.available}, 17:${slot17?.available}, 18:${slot18?.available}, 19:${slot19?.available}`);
    }
  }

  // 8. Admin Rejection Flow
  // Create a second booking to test rejection
  res = await makeRequest('POST', '/api/bookings', {
    stadium: testStadiumId,
    bookingDate: testDate,
    startTime: '08:00',
    duration: 2,
    termsAccepted: true
  }, regularToken);

  if (res.status === 201 && res.data?.booking?._id) {
    const rejectBookingId = res.data.booking._id;
    res = await makeRequest('PUT', `/api/bookings/${rejectBookingId}/status`, {
      status: 'rejected',
      rejectionReason: 'Emergency maintenance scheduled for turf aeration'
    }, adminToken);

    if (res.status === 200 && res.data?.booking?.status === 'rejected' && res.data?.booking?.rejectionReason.includes('Emergency maintenance')) {
      logPass('Test 12 - Admin status update to "rejected" persists rejectionReason and status');
    } else {
      logFail('Test 12 - Admin rejection status update', 'rejected status with reason', res.data?.booking?.status);
    }
  } else {
    logFail('Test 12 - Pre-requisite booking for rejection', 'HTTP 201', res.status);
  }

  // 9. Review System and Review Eligibility
  // Check review eligibility for testStadiumId (currently booking is 'confirmed', not 'completed')
  res = await makeRequest('GET', `/api/reviews/eligible-bookings/${testStadiumId}`, null, regularToken);
  if (res.status === 200 && res.data?.isEligible === false) {
    logPass('Test 13 - Review eligibility correctly reports false when no completed bookings exist');
  } else {
    logFail('Test 13 - Review eligibility check', 'isEligible = false', res.data?.isEligible);
  }

  // Admin marks the 3-hour booking as 'completed'
  res = await makeRequest('PUT', `/api/bookings/${bookingId}/status`, {
    status: 'completed'
  }, adminToken);
  if (res.status === 200) {
    logPass('Test 14 - Admin transitions booking to completed');
  } else {
    logFail('Test 14 - Admin complete booking', 'HTTP 200', res.status);
  }

  // Now re-check eligibility
  res = await makeRequest('GET', `/api/reviews/eligible-bookings/${testStadiumId}`, null, regularToken);
  if (res.status === 200 && res.data?.isEligible === true && res.data.eligibleBookings.length > 0) {
    logPass('Test 15 - Review eligibility correctly reports true once booking is completed');
  } else {
    logFail('Test 15 - Review eligibility after completion', 'isEligible = true', res.data?.isEligible);
  }

  // Submit Review with rating (rating is required, text & photo optional)
  res = await makeRequest('POST', '/api/reviews', {
    stadium: testStadiumId,
    booking: bookingId,
    rating: 5,
    comment: 'Spectacular turf quality and impeccable floodlights!',
    photo: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800'
  }, regularToken);

  if (res.status === 201 && res.data?.review?.rating === 5 && res.data.review.photo) {
    logPass('Test 16 - Review created successfully with rating, comment, photo and linked to stadium & booking');
  } else {
    logFail('Test 16 - Submit review', 'HTTP 201 with rating and photo', res.status);
  }

  // Verify Stadium Reviews API returns the new review
  res = await makeRequest('GET', `/api/reviews/stadium/${testStadiumId}`);
  if (res.status === 200 && res.data.reviews.length > 0 && res.data.averageRating === 5) {
    logPass('Test 17 - Stadium reviews public endpoint returns review and averageRating');
  } else {
    logFail('Test 17 - Stadium reviews public endpoint', 'averageRating = 5', res.data?.averageRating);
  }

  // Re-check eligibility after reviewing (duplicate review prevented)
  res = await makeRequest('GET', `/api/reviews/eligible-bookings/${testStadiumId}`, null, regularToken);
  if (res.status === 200 && res.data?.isEligible === false) {
    logPass('Test 18 - Completed booking removed from eligible bookings list once reviewed');
  } else {
    logFail('Test 18 - Eligible bookings post-review', 'isEligible = false', res.data?.isEligible);
  }

  // Clean up
  await makeRequest('PUT', `/api/bookings/${bookingId}/cancel`, null, adminToken);

  console.log('\n===========================================================');
  console.log(`TOTAL: 18 | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('===========================================================');
  if (failed === 0) {
    console.log('ALL DYNAMIC BOOKING ENGINE & GST TESTS PASSED CONVINCINGLY!');
  }
};

runTests();
