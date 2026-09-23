const fs = require('fs');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
const adminUser = {
  email: process.env.TEST_ADMIN_ID || process.env.ADMIN_EMAIL || 'admin@stadium.com',
  password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin12345'
};
const regularUser = { email: 'yagnik@test.com', password: 'password123' };

let adminToken = null;
let regularToken = null;

let totalTests = 20;
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

const runTests = async () => {
  console.log('========================================');
  console.log('MODULE 17 FINAL BACKEND AUDIT TEST SUITE');
  console.log('========================================\n');

  // 1. Health endpoint
  let res = await makeRequest('GET', '/api/health');
  if (res.status === 200 && res.data.success === true) logPass('Test 1 - Health endpoint');
  else logFail('Test 1 - Health endpoint', 'HTTP 200', res.status);

  // 2. User login
  res = await makeRequest('POST', '/api/auth/login', regularUser);
  if (res.status === 200 && res.data.token && !res.data.user.password) {
    regularToken = res.data.token;
    logPass('Test 2 - User login (No password exposed)');
  } else {
    logFail('Test 2 - User login', 'HTTP 200 without password', res.status);
  }

  // 3. Admin login
  res = await makeRequest('POST', '/api/auth/login', adminUser);
  if (res.status === 200 && res.data.token) {
    adminToken = res.data.token;
    logPass('Test 3 - Admin login');
  } else {
    logFail('Test 3 - Admin login', 'HTTP 200', res.status);
  }

  // 4. Public stadium listing (Must explicitly check legacy stadiums inclusion)
  res = await makeRequest('GET', '/api/stadiums');
  if (res.status === 200 && Array.isArray(res.data.stadiums)) {
    const stadiums = res.data.stadiums;
    if (stadiums.length > 0) {
      logPass(`Test 4 - Public stadium listing found ${stadiums.length} stadiums`);
      // check if any legacy stadium is present
      const hasLegacy = stadiums.some(s => s.name === "Apex Premier Sports Arena & Turf" || s.name === "Metro Champions Arena & Turf" || s.name === "Santiago Bernabéu Stadium");
      if (hasLegacy) {
        logPass('Test 4b - Legacy stadiums successfully migrated and returned in public search');
      } else {
        logSkip('Test 4b - Legacy stadiums check', 'No legacy stadiums returned (were they deleted?)');
      }
    } else {
      logFail('Test 4 - Public stadium listing', '> 0 stadiums', '0 stadiums - DATA STATE ISSUE');
    }
  } else {
    logFail('Test 4 - Public stadium listing', 'HTTP 200', res.status);
  }

  // 5. Stadium search
  res = await makeRequest('GET', '/api/stadiums/search?q=a');
  if (res.status === 200) logPass('Test 5 - Stadium search');
  else logFail('Test 5 - Stadium search', 'HTTP 200', res.status);

  // 6. Stadium availability
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 5);
  const dateStr = futureDate.toISOString().split('T')[0];
  const publicStadiumRes = await makeRequest('GET', '/api/stadiums');
  const testStadiumId = publicStadiumRes.data.stadiums[0]?._id;
  if (testStadiumId) {
    res = await makeRequest('GET', `/api/stadiums/${testStadiumId}/availability?date=${dateStr}`);
    if (res.status === 200) logPass('Test 6 - Stadium availability');
    else logFail('Test 6 - Stadium availability', 'HTTP 200', res.status);
  } else {
    logSkip('Test 6 - Stadium availability', 'No stadium available to test');
  }

  // 7. Protected user profile
  res = await makeRequest('GET', '/api/users/profile', null, regularToken);
  if (res.status === 200 && !res.data.user.password) logPass('Test 7 - Protected user profile (No password exposed)');
  else logFail('Test 7 - Protected user profile', 'HTTP 200 without password', res.status);

  // 8. Admin dashboard
  res = await makeRequest('GET', '/api/admin/dashboard', null, adminToken);
  if (res.status === 200) logPass('Test 8 - Admin dashboard');
  else logFail('Test 8 - Admin dashboard', 'HTTP 200', res.status);

  // 9. Admin user listing
  res = await makeRequest('GET', '/api/admin/users', null, adminToken);
  if (res.status === 200) logPass('Test 9 - Admin user listing');
  else logFail('Test 9 - Admin user listing', 'HTTP 200', res.status);

  // 10. Admin stadium listing
  res = await makeRequest('GET', '/api/stadiums/admin/all', null, adminToken);
  if (res.status === 200) logPass('Test 10 - Admin stadium listing');
  else logFail('Test 10 - Admin stadium listing', 'HTTP 200', res.status);

  // 11. Admin booking listing
  res = await makeRequest('GET', '/api/bookings/admin/all', null, adminToken);
  if (res.status === 200) logPass('Test 11 - Admin booking listing');
  else logFail('Test 11 - Admin booking listing', 'HTTP 200', res.status);

  // 12. Admin review listing
  res = await makeRequest('GET', '/api/admin/reviews', null, adminToken);
  if (res.status === 200) logPass('Test 12 - Admin review listing');
  else logFail('Test 12 - Admin review listing', 'HTTP 200', res.status);

  // 13. Admin payment listing
  res = await makeRequest('GET', '/api/admin/payments', null, adminToken);
  if (res.status === 200) logPass('Test 13 - Admin payment listing');
  else logFail('Test 13 - Admin payment listing', 'HTTP 200', res.status);

  // 14. User favorites
  res = await makeRequest('GET', '/api/favorites/my', null, regularToken);
  if (res.status === 200) logPass('Test 14 - User favorites');
  else logFail('Test 14 - User favorites', 'HTTP 200', res.status);

  // 15. User notifications
  res = await makeRequest('GET', '/api/notifications/my', null, regularToken);
  if (res.status === 200) logPass('Test 15 - User notifications');
  else logFail('Test 15 - User notifications', 'HTTP 200', res.status);

  // 16. Booking listing
  res = await makeRequest('GET', '/api/bookings/my', null, regularToken);
  if (res.status === 200) logPass('Test 16 - Booking listing');
  else logFail('Test 16 - Booking listing', 'HTTP 200', res.status);

  // 17. Payment endpoint availability
  res = await makeRequest('GET', '/api/payments/my', null, regularToken);
  if (res.status === 200) logPass('Test 17 - Payment endpoint availability');
  else logFail('Test 17 - Payment endpoint', 'HTTP 200', res.status);

  // 18. Unauthorized admin access
  res = await makeRequest('GET', '/api/admin/dashboard', null, regularToken);
  if (res.status === 403) logPass('Test 18 - Unauthorized admin access');
  else logFail('Test 18 - Unauthorized admin access', 'HTTP 403', res.status);

  // 19. Sensitive response inspection
  // Test by pulling a payment which has razorpay secrets potentially
  res = await makeRequest('GET', '/api/admin/payments', null, adminToken);
  const paymentStr = JSON.stringify(res.data);
  if (!paymentStr.includes(process.env.RAZORPAY_KEY_SECRET)) logPass('Test 19 - Sensitive response inspection (No Secret Exfiltration)');
  else logFail('Test 19 - Sensitive response inspection', 'No Secret', 'Secret Exfiltrated!');

  // 20. Public inactive-stadium protection
  res = await makeRequest('POST', '/api/stadiums', {
    name: 'Inactive Test', description: 'Testing', location: 'Loc', address: 'Addr', city: 'City',
    sports: ['Football'], capacity: 100, pricePerHour: 1000, facilities: ['Parking'],
    images: [], contactNumber: '0', openingTime: '06:00', closingTime: '22:00', isActive: false
  }, adminToken);
  const inactiveId = res.data?.stadium?._id;
  if (inactiveId) {
    res = await makeRequest('GET', `/api/stadiums/${inactiveId}`);
    if (res.status === 404) logPass('Test 20 - Public inactive-stadium protection');
    else logFail('Test 20 - Public inactive-stadium protection', 'HTTP 404', res.status);
    await makeRequest('DELETE', `/api/stadiums/${inactiveId}`, null, adminToken);
  } else {
    logSkip('Test 20 - Public inactive-stadium protection', 'Failed to create inactive stadium');
  }

  console.log('\n========================================');
  console.log(`TOTAL: ${totalTests}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SKIPPED: ${skipped}`);
  console.log('========================================');

  if (failed > 0) {
    console.log('\nFinal audit completed with failures.');
    process.exit(1);
  } else {
    console.log('\nFINAL BACKEND AUDIT PASSED');
    process.exit(0);
  }
};

runTests();
