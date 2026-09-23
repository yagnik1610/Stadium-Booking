const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5000';

// Known data
const adminUser = {
  email: process.env.TEST_ADMIN_ID || process.env.ADMIN_EMAIL || 'admin@stadium.com',
  password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin12345'
};
const regularUser = { email: 'yagnik@test.com', password: 'password123' };

let adminToken = null;
let regularToken = null;

let totalTests = 24;
let passed = 0;
let failed = 0;
let skipped = 0;

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

const logSkip = (name, reason) => {
  skipped++;
  console.log(`[SKIP] ${name} - ${reason}`);
};

const makeRequest = async (method, endpoint, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

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

const runTests = async () => {
  console.log('========================================');
  console.log('MODULE 9 ADMIN DASHBOARD TEST SUITE');
  console.log('========================================\n');

  // TEST 1 — ADMIN LOGIN
  let res = await makeRequest('POST', '/api/auth/login', adminUser);
  if (res.status === 200 && res.data?.token) {
    adminToken = res.data.token;
    logPass('Test 1 - Admin Login');
  } else {
    logFail('Test 1 - Admin Login', 'HTTP 200 and token', res.status);
    console.log('Cannot proceed without admin token.');
    return;
  }

  // TEST 2 — NORMAL USER LOGIN
  res = await makeRequest('POST', '/api/auth/login', regularUser);
  if (res.status === 200 && res.data?.token) {
    regularToken = res.data.token;
    logPass('Test 2 - Normal User Login');
  } else {
    logFail('Test 2 - Normal User Login', 'HTTP 200 and token', res.status);
    console.log('Cannot proceed without regular token.');
    return;
  }

  // TEST 3 — UNAUTHENTICATED DASHBOARD
  res = await makeRequest('GET', '/api/admin/dashboard');
  if (res.status === 401) {
    logPass('Test 3 - Unauthenticated Dashboard');
  } else {
    logFail('Test 3 - Unauthenticated Dashboard', 'HTTP 401', res.status);
  }

  // TEST 4 — NORMAL USER DASHBOARD ACCESS
  res = await makeRequest('GET', '/api/admin/dashboard', null, regularToken);
  if (res.status === 403) {
    logPass('Test 4 - Normal User Dashboard Access');
  } else {
    logFail('Test 4 - Normal User Dashboard Access', 'HTTP 403', res.status);
  }

  // TEST 5 — ADMIN DASHBOARD ACCESS
  res = await makeRequest('GET', '/api/admin/dashboard', null, adminToken);
  const dashboardData = res.data;
  if (res.status === 200 && dashboardData?.success === true && dashboardData.stats && dashboardData.recentBookings) {
    logPass('Test 5 - Admin Dashboard Access');
  } else {
    logFail('Test 5 - Admin Dashboard Access', 'HTTP 200 and structure', res.status);
    console.log('Stopping test suite as dashboard data is required for further tests.');
    return;
  }

  const s = dashboardData.stats;

  // TEST 6 — DASHBOARD STAT STRUCTURE
  const requiredKeys = [
    'totalUsers', 'adminUsers', 'regularUsers',
    'totalStadiums', 'activeStadiums', 'inactiveStadiums',
    'totalBookings', 'pendingBookings', 'confirmedBookings', 'completedBookings', 'cancelledBookings',
    'totalReviews', 'averageRating', 'totalFavorites', 'totalNotifications', 'unreadNotifications'
  ];
  let structureValid = true;
  for (const key of requiredKeys) {
    if (typeof s[key] !== 'number') {
      structureValid = false;
      console.log(`Key ${key} is missing or not a number: ${s[key]}`);
      break;
    }
  }
  if (structureValid) {
    logPass('Test 6 - Dashboard Stat Structure');
  } else {
    logFail('Test 6 - Dashboard Stat Structure', 'All keys present as numbers', 'Invalid structure');
  }

  // TEST 7 — USER COUNT CONSISTENCY
  if (s.adminUsers + s.regularUsers === s.totalUsers) {
    logPass('Test 7 - User Count Consistency');
  } else {
    logFail('Test 7 - User Count Consistency', `admins + regular = ${s.totalUsers}`, s.adminUsers + s.regularUsers);
  }

  // TEST 8 — STADIUM COUNT CONSISTENCY
  if (s.activeStadiums + s.inactiveStadiums === s.totalStadiums) {
    logPass('Test 8 - Stadium Count Consistency');
  } else {
    logFail('Test 8 - Stadium Count Consistency', `active + inactive = ${s.totalStadiums}`, s.activeStadiums + s.inactiveStadiums);
  }

  // TEST 9 — BOOKING COUNT CONSISTENCY
  const sumBookings = s.pendingBookings + s.confirmedBookings + s.completedBookings + s.cancelledBookings;
  if (sumBookings <= s.totalBookings) {
    logPass('Test 9 - Booking Count Consistency');
  } else {
    logFail('Test 9 - Booking Count Consistency', `sum <= ${s.totalBookings}`, sumBookings);
  }

  // TEST 10 — REVIEW STATISTICS
  if (s.totalReviews >= 0 && typeof s.averageRating === 'number') {
    if (s.totalReviews === 0 && s.averageRating === 0) {
      logPass('Test 10 - Review Statistics');
    } else if (s.totalReviews > 0 && s.averageRating >= 1 && s.averageRating <= 5) {
      logPass('Test 10 - Review Statistics');
    } else {
      logFail('Test 10 - Review Statistics', 'Valid averageRating', s.averageRating);
    }
  } else {
    logFail('Test 10 - Review Statistics', 'totalReviews >= 0 and averageRating is number', `total: ${s.totalReviews}, avg: ${s.averageRating}`);
  }

  // TEST 11 — FAVORITE STATISTICS
  if (s.totalFavorites >= 0) {
    logPass('Test 11 - Favorite Statistics');
  } else {
    logFail('Test 11 - Favorite Statistics', '>= 0', s.totalFavorites);
  }

  // TEST 12 — NOTIFICATION STATISTICS
  if (s.totalNotifications >= 0 && s.unreadNotifications >= 0 && s.unreadNotifications <= s.totalNotifications) {
    logPass('Test 12 - Notification Statistics');
  } else {
    logFail('Test 12 - Notification Statistics', 'Valid bounds', `total: ${s.totalNotifications}, unread: ${s.unreadNotifications}`);
  }

  // TEST 13 — RECENT BOOKINGS STRUCTURE
  const rb = dashboardData.recentBookings;
  if (Array.isArray(rb) && rb.length <= 5) {
    let clean = true;
    for (const b of rb) {
      if (b.password || b.notes || (b.user && b.user.password)) {
        clean = false;
        break;
      }
    }
    if (clean) logPass('Test 13 - Recent Bookings Structure');
    else logFail('Test 13 - Recent Bookings Structure', 'No private data', 'Private data exposed');
  } else {
    logFail('Test 13 - Recent Bookings Structure', 'Array length <= 5', `length: ${rb ? rb.length : 'not array'}`);
  }

  // TEST 14 — RECENT BOOKINGS ORDER
  if (rb.length >= 2) {
    let ordered = true;
    for (let i = 0; i < rb.length - 1; i++) {
      if (new Date(rb[i].createdAt) < new Date(rb[i+1].createdAt)) {
        ordered = false;
        break;
      }
    }
    if (ordered) logPass('Test 14 - Recent Bookings Order');
    else logFail('Test 14 - Recent Bookings Order', 'Newest first', 'Incorrect sorting');
  } else {
    logSkip('Test 14 - Recent Bookings Order', 'Fewer than 2 recent bookings');
  }

  // TEST 15 — ADMIN USERS ENDPOINT REGRESSION
  res = await makeRequest('GET', '/api/admin/users', null, adminToken);
  if (res.status === 200) logPass('Test 15 - Admin Users Endpoint Regression');
  else logFail('Test 15 - Admin Users Endpoint Regression', 'HTTP 200', res.status);

  // TEST 16 — NORMAL USER ADMIN USERS PROTECTION
  res = await makeRequest('GET', '/api/admin/users', null, regularToken);
  if (res.status === 403) logPass('Test 16 - Normal User Admin Users Protection');
  else logFail('Test 16 - Normal User Admin Users Protection', 'HTTP 403', res.status);

  // TEST 17 — ADMIN STADIUM ENDPOINT REGRESSION
  res = await makeRequest('GET', '/api/stadiums/admin/all', null, adminToken);
  if (res.status === 200) logPass('Test 17 - Admin Stadium Endpoint Regression');
  else logFail('Test 17 - Admin Stadium Endpoint Regression', 'HTTP 200', res.status);

  // TEST 18 — NORMAL USER STADIUM ADMIN PROTECTION
  res = await makeRequest('GET', '/api/stadiums/admin/all', null, regularToken);
  if (res.status === 403) logPass('Test 18 - Normal User Stadium Admin Protection');
  else logFail('Test 18 - Normal User Stadium Admin Protection', 'HTTP 403', res.status);

  // TEST 19 — ADMIN BOOKINGS ENDPOINT REGRESSION
  res = await makeRequest('GET', '/api/bookings/admin/all', null, adminToken);
  if (res.status === 200) logPass('Test 19 - Admin Bookings Endpoint Regression');
  else logFail('Test 19 - Admin Bookings Endpoint Regression', 'HTTP 200', res.status);

  // TEST 20 — NORMAL USER BOOKING ADMIN PROTECTION
  res = await makeRequest('GET', '/api/bookings/admin/all', null, regularToken);
  if (res.status === 403) logPass('Test 20 - Normal User Booking Admin Protection');
  else logFail('Test 20 - Normal User Booking Admin Protection', 'HTTP 403', res.status);

  // TEST 21 — ADMIN REVIEWS ENDPOINT REGRESSION
  res = await makeRequest('GET', '/api/reviews/admin/all', null, adminToken);
  if (res.status === 200) logPass('Test 21 - Admin Reviews Endpoint Regression');
  else logFail('Test 21 - Admin Reviews Endpoint Regression', 'HTTP 200', res.status);

  // TEST 22 — NORMAL USER REVIEW ADMIN PROTECTION
  res = await makeRequest('GET', '/api/reviews/admin/all', null, regularToken);
  if (res.status === 403) logPass('Test 22 - Normal User Review Admin Protection');
  else logFail('Test 22 - Normal User Review Admin Protection', 'HTTP 403', res.status);

  // TEST 23 — ADMIN PRIVACY
  const dashboardStr = JSON.stringify(dashboardData);
  if (!dashboardStr.includes('password') && !dashboardStr.includes('notes') && !dashboardStr.includes('hashedPassword')) {
    logPass('Test 23 - Admin Privacy');
  } else {
    logFail('Test 23 - Admin Privacy', 'No password/notes in response', 'Found forbidden strings');
  }

  // TEST 24 — SERVER STABILITY
  res = await makeRequest('GET', '/api/admin/dashboard', null, adminToken);
  if (res.status === 200) logPass('Test 24 - Server Stability');
  else logFail('Test 24 - Server Stability', 'HTTP 200', res.status);

  // NO DATA CREATED, SO NO DATA MODIFIED. NO CLEANUP NEEDED.
  console.log('\n--- CLEANUP ---');
  console.log('Cleanup completed. (Read-only test, zero data modification).');

  // FINAL SUMMARY
  console.log('\n========================================');
  console.log(`TOTAL: ${totalTests}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SKIPPED: ${skipped}`);
  console.log('========================================');

  if (failed > 0) {
    console.log('\nSome tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\nAll tests passed successfully!');
    process.exit(0);
  }
};

runTests();
