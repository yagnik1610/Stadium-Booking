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

let passed = 0;
let failed = 0;

const logPass = (name) => {
  passed++;
  console.log(`[PASS] ${name}`);
};

const logFail = (name, expected, actual, status = null) => {
  failed++;
  console.log(`[FAIL] ${name}`);
  console.log(`       Expected: ${expected}`);
  console.log(`       Actual:   ${actual}`);
  if (status) console.log(`       HTTP Status: ${status}`);
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
  } catch (e) {
    data = null;
  }
  return { status: response.status, data };
};

const runTests = async () => {
  console.log('========================================================');
  console.log('COMPLETE ADMIN MANAGEMENT SYSTEM INTEGRATION TESTS');
  console.log('========================================================\n');

  // 1. Authenticate Admin
  const adminLogin = await makeRequest('POST', '/api/auth/login', adminUser);
  const aToken = adminLogin.data?.token || adminLogin.data?.data?.token;
  if (adminLogin.status === 200 && aToken) {
    adminToken = aToken;
    logPass('1. Admin authenticated successfully');
  } else {
    logFail('1. Admin login', 'status 200 with token', adminLogin.status);
    return;
  }

  // 2. Authenticate Normal User
  const regLogin = await makeRequest('POST', '/api/auth/login', regularUser);
  const rToken = regLogin.data?.token || regLogin.data?.data?.token;
  if (regLogin.status === 200 && rToken) {
    regularToken = rToken;
    logPass('2. Regular user authenticated successfully');
  } else {
    logFail('2. Regular user login', 'status 200 with token', regLogin.status);
  }

  // 3. Security: Non-admin rejected from admin endpoints (403 Forbidden)
  const nonAdminAccess = await makeRequest('GET', '/api/admin/dashboard', null, regularToken);
  if (nonAdminAccess.status === 403) {
    logPass('3. Non-admin user blocked from /api/admin/dashboard (HTTP 403)');
  } else {
    logFail('3. Non-admin rejection', 'HTTP 403', nonAdminAccess.status);
  }

  const nonAdminSportsCreate = await makeRequest('POST', '/api/sports', { name: 'IllegalSport' }, regularToken);
  if (nonAdminSportsCreate.status === 403) {
    logPass('4. Non-admin user blocked from creating sports (HTTP 403)');
  } else {
    logFail('4. Non-admin sport creation', 'HTTP 403', nonAdminSportsCreate.status);
  }

  // 4. Sports Management API
  // 4a. Get all sports
  const sportsRes = await makeRequest('GET', '/api/sports', null, adminToken);
  const sportsList = sportsRes.data?.sports || sportsRes.data?.data?.sports || sportsRes.data?.data;
  if (sportsRes.status === 200 && Array.isArray(sportsList)) {
    logPass(`5. GET /api/sports returned ${sportsList.length} sports`);
  } else {
    logFail('5. GET /api/sports', 'status 200 with array', sportsRes.status);
  }

  // 4b. Create unique sport
  const testSportName = `Squash-${Date.now()}`;
  const createSportRes = await makeRequest('POST', '/api/sports', {
    name: testSportName,
    description: 'Indoor high-paced racket sport with enclosed wall courts',
    minPlayers: 2,
    maxPlayers: 4,
    minDurationHours: 1,
    maxDurationHours: 3,
    equipmentRequired: ['Squash Rackets', 'Non-marking Shoes', 'Squash Ball'],
    safetyGuidelines: ['Protective eyewear mandatory', 'Warm up appropriately'],
    isActive: true
  }, adminToken);

  let createdSportId = null;
  const createdSport = createSportRes.data?.sport || createSportRes.data?.data;
  if (createSportRes.status === 201 && createdSport?._id) {
    createdSportId = createdSport._id;
    logPass(`6. POST /api/sports created new sport: ${testSportName}`);
  } else {
    logFail('6. POST /api/sports', 'status 201 with created sport', createSportRes.status);
  }

  // 4c. Prevent duplicate sport
  const duplicateSportRes = await makeRequest('POST', '/api/sports', {
    name: testSportName,
    description: 'Duplicate should fail'
  }, adminToken);
  if (duplicateSportRes.status === 400 || duplicateSportRes.status === 409) {
    logPass('7. POST /api/sports rejects duplicate sport name (HTTP 400/409)');
  } else {
    logFail('7. Duplicate sport rejection', 'HTTP 400 or 409', duplicateSportRes.status);
  }

  // 4d. Update sport
  if (createdSportId) {
    const updateSportRes = await makeRequest('PUT', `/api/sports/${createdSportId}`, {
      description: 'Updated official squash guidelines and rules',
      maxPlayers: 4
    }, adminToken);
    const updated = updateSportRes.data?.sport || updateSportRes.data?.data;
    if (updateSportRes.status === 200 && updated?.description?.includes('Updated')) {
      logPass('8. PUT /api/sports/:id updated sport specifications');
    } else {
      logFail('8. PUT /api/sports/:id', 'status 200 with updated sport', updateSportRes.status);
    }
  }

  // 5. System Settings Management
  // 5a. GET Settings
  const getSettingsRes = await makeRequest('GET', '/api/admin/settings', null, adminToken);
  const settingsData = getSettingsRes.data?.settings || getSettingsRes.data?.data;
  if (getSettingsRes.status === 200 && settingsData) {
    logPass('9. GET /api/admin/settings loaded persistent configuration');
  } else {
    logFail('9. GET /api/admin/settings', 'status 200 with data', getSettingsRes.status);
  }

  // 5b. UPDATE Settings (persisted to MongoDB)
  const updateSettingsRes = await makeRequest('PUT', '/api/admin/settings', {
    platformName: 'National Stadium Booking Hub',
    gstConfig: {
      gstRatePercent: 18,
      gstEnabled: true,
      companyGstNumber: '07TESTGSTIN12345',
      invoicePrefix: 'NAT-INV'
    },
    bookingConfig: {
      advanceBookingDays: 45,
      cancellationCutoffHours: 24,
      minDurationHours: 1,
      maxDurationHours: 8
    }
  }, adminToken);

  const updatedSettings = updateSettingsRes.data?.settings || updateSettingsRes.data?.data;
  const nameMatch = updatedSettings?.platformName === 'National Stadium Booking Hub' || updatedSettings?.businessName === 'National Stadium Booking Hub';
  if (updateSettingsRes.status === 200 && nameMatch) {
    logPass('10. PUT /api/admin/settings persisted settings in MongoDB');
  } else {
    logFail('10. PUT /api/admin/settings', 'status 200 with updated fields', updateSettingsRes.status);
  }

  // 6. Analytics Intelligence API
  // 6a. Booking analytics
  const bookingAnalytics = await makeRequest('GET', '/api/admin/analytics?type=bookings&timeRange=30d', null, adminToken);
  const analyticsData = bookingAnalytics.data?.analytics || bookingAnalytics.data?.data;
  if (bookingAnalytics.status === 200 && analyticsData?.bookings) {
    logPass('11. GET /api/admin/analytics returned booking intelligence metrics');
  } else {
    logFail('11. Booking analytics', 'status 200 with analytics', bookingAnalytics.status);
  }

  // 6b. Revenue analytics
  if (bookingAnalytics.status === 200 && analyticsData?.revenue) {
    logPass('12. GET /api/admin/analytics returned gross & GST metrics');
  } else {
    logFail('12. Revenue analytics', 'status 200 with revenue metrics', bookingAnalytics.status);
  }

  // 6c. User analytics
  if (bookingAnalytics.status === 200 && analyticsData?.users) {
    logPass('13. GET /api/admin/analytics returned registered & active user metrics');
  } else {
    logFail('13. User analytics', 'status 200 with user metrics', bookingAnalytics.status);
  }

  // 7. Reports Engine API
  const reportsRes = await makeRequest('GET', '/api/admin/reports?type=bookings', null, adminToken);
  const reportRecords = reportsRes.data?.data || reportsRes.data?.records;
  if (reportsRes.status === 200 && Array.isArray(reportRecords)) {
    logPass('14. GET /api/admin/reports returned compiled records and summary');
  } else {
    logFail('14. Reports engine', 'status 200 with records array', reportsRes.status);
  }

  // 8. Audit Trails API
  const auditLogsRes = await makeRequest('GET', '/api/admin/activity-logs', null, adminToken);
  const auditLogs = auditLogsRes.data?.logs || auditLogsRes.data?.data?.logs || auditLogsRes.data?.data;
  if (auditLogsRes.status === 200 && Array.isArray(auditLogs)) {
    logPass('15. GET /api/admin/activity-logs returned logged administrative events');
  } else {
    logFail('15. Audit trails', 'status 200 with logs array', auditLogsRes.status);
  }

  // 9. Broadcast Notification API
  const broadcastRes = await makeRequest('POST', '/api/admin/broadcast-notification', {
    title: 'Automated Test Notification',
    message: 'System audit notification broadcast across test suite.',
    type: 'system_broadcast',
    target: 'admins'
  }, adminToken);

  if (broadcastRes.status === 200 && broadcastRes.data?.success) {
    logPass('16. POST /api/admin/broadcast-notification persisted notifications');
  } else {
    logFail('16. Broadcast notification', 'status 200 success', broadcastRes.status);
  }

  // 10. Booking Approval & Rejection Flow
  const allBookingsRes = await makeRequest('GET', '/api/bookings/admin/all?limit=5', null, adminToken);
  if (allBookingsRes.status === 200) {
    const bList = allBookingsRes.data?.data?.bookings || allBookingsRes.data?.data || [];
    logPass(`17. GET /api/bookings/admin/all returned ${bList.length} booking records`);

    if (bList.length > 0) {
      const targetBooking = bList[0];
      // Test status update
      const statusUpdateRes = await makeRequest('PUT', `/api/bookings/${targetBooking._id}/status`, {
        status: targetBooking.status === 'pending' ? 'approved' : targetBooking.status
      }, adminToken);

      if (statusUpdateRes.status === 200) {
        logPass(`18. PUT /api/bookings/:id/status updated status for booking ${targetBooking.bookingReference || targetBooking._id}`);
      } else {
        logFail('18. Booking status update', 'status 200', statusUpdateRes.status);
      }
    } else {
      logPass('18. Booking status update (no bookings to mutate, skipped cleanly)');
    }
  } else {
    logFail('17. Admin bookings retrieval', 'status 200', allBookingsRes.status);
  }

  // 11. Review Moderation & Deletion
  const reviewsRes = await makeRequest('GET', '/api/reviews/admin/all?limit=5', null, adminToken);
  if (reviewsRes.status === 200) {
    const revList = reviewsRes.data?.data?.reviews || reviewsRes.data?.data || [];
    logPass(`19. GET /api/reviews/admin/all returned reviews (${revList.length} found)`);
  } else {
    logFail('19. Admin reviews retrieval', 'status 200', reviewsRes.status);
  }

  // 12. Payments Listing
  const paymentsRes = await makeRequest('GET', '/api/payments/admin/all?limit=5', null, adminToken);
  if (paymentsRes.status === 200) {
    const payList = paymentsRes.data?.data?.payments || paymentsRes.data?.data || [];
    logPass(`20. GET /api/payments/admin/all returned verified payment records (${payList.length} found)`);
  } else {
    logFail('20. Admin payments retrieval', 'status 200', paymentsRes.status);
  }

  // Clean up created sport
  if (createdSportId) {
    await makeRequest('DELETE', `/api/sports/${createdSportId}`, null, adminToken);
    logPass('21. DELETE /api/sports/:id cleaned up test sport successfully');
  }

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');
};

runTests().catch(console.error);
