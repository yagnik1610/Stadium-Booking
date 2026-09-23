const fs = require('fs');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';

const adminUser = {
  email: process.env.TEST_ADMIN_ID || process.env.ADMIN_EMAIL || 'admin@stadium.com',
  password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin12345'
};
const regularUser = { email: 'yagnik@test.com', password: 'password123' };
const user2 = { email: 'testuser2@example.com', password: 'password123' };

let adminToken = null;
let regularToken = null;
let user2Token = null;
let regularUserId = null;
let user2Id = null;

let totalTests = 23;
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
  console.log('MODULE 12 USER PROFILE TEST SUITE');
  console.log('========================================\n');

  // TEST 1 — ADMIN LOGIN
  let res = await makeRequest('POST', '/api/auth/login', adminUser);
  if (res.status === 200 && res.data?.token) {
    adminToken = res.data.token;
    logPass('Test 1 - Admin Login');
  } else {
    logFail('Test 1 - Admin Login', 'HTTP 200 and token', res.status);
  }

  // TEST 2 — NORMAL USER LOGIN
  res = await makeRequest('POST', '/api/auth/login', regularUser);
  if (res.status === 200 && res.data?.token) {
    regularToken = res.data.token;
    regularUserId = res.data.user._id;
    logPass('Test 2 - Normal User Login');
  } else {
    logFail('Test 2 - Normal User Login', 'HTTP 200 and token', res.status);
    console.log('Cannot proceed without regular token.');
    return;
  }

  // TEST 3 — SECOND USER LOGIN
  res = await makeRequest('POST', '/api/auth/login', user2);
  if (res.status === 200 && res.data?.token) {
    user2Token = res.data.token;
    user2Id = res.data.user._id;
    logPass('Test 3 - Second User Login');
  } else {
    logFail('Test 3 - Second User Login', 'HTTP 200 and token', res.status);
  }

  // TEST 4 — GET PROFILE WITHOUT AUTHENTICATION
  res = await makeRequest('GET', '/api/users/profile');
  if (res.status === 401) logPass('Test 4 - GET profile without authentication');
  else logFail('Test 4 - GET profile without authentication', 'HTTP 401', res.status);

  // TEST 5 — GET CURRENT USER PROFILE
  res = await makeRequest('GET', '/api/users/profile', null, regularToken);
  if (res.status === 200 && res.data?.user) {
    const user = res.data.user;
    if (user.name && user.email && user.role === 'user' && !user.password) {
      logPass('Test 5 - GET current user profile');
    } else {
      logFail('Test 5 - GET current user profile', 'Valid user object without password', JSON.stringify(user));
    }
  } else {
    logFail('Test 5 - GET current user profile', 'HTTP 200', res.status);
  }

  // TEST 6 — UPDATE CURRENT USER NAME
  res = await makeRequest('PUT', '/api/users/profile', { name: 'Yagnik Updated' }, regularToken);
  if (res.status === 200 && res.data?.user?.name === 'Yagnik Updated') {
    logPass('Test 6 - Update current user name');
  } else {
    logFail('Test 6 - Update current user name', 'HTTP 200 and Name: Yagnik Updated', `Status: ${res.status}, Name: ${res.data?.user?.name}`);
  }

  // TEST 7 — UPDATE CURRENT USER EMAIL
  res = await makeRequest('PUT', '/api/users/profile', { email: 'yagnik_new@test.com' }, regularToken);
  if (res.status === 200 && res.data?.user?.email === 'yagnik_new@test.com') {
    logPass('Test 7 - Update current user email');
  } else {
    logFail('Test 7 - Update current user email', 'HTTP 200 and Email: yagnik_new@test.com', `Status: ${res.status}, Email: ${res.data?.user?.email}`);
  }

  // TEST 8 — ATTEMPT DUPLICATE EMAIL
  res = await makeRequest('PUT', '/api/users/profile', { email: user2.email }, regularToken);
  if (res.status === 400 || res.status === 409) logPass('Test 8 - Attempt duplicate email');
  else logFail('Test 8 - Attempt duplicate email', 'HTTP 400 or 409', res.status);

  // TEST 9 — INVALID EMAIL FORMAT
  res = await makeRequest('PUT', '/api/users/profile', { email: 'not-an-email' }, regularToken);
  if (res.status === 400) logPass('Test 9 - Invalid email format');
  else logFail('Test 9 - Invalid email format', 'HTTP 400', res.status);

  // TEST 10 — EMPTY / INVALID NAME
  res = await makeRequest('PUT', '/api/users/profile', { name: '   ' }, regularToken);
  if (res.status === 400) logPass('Test 10 - Empty/invalid name');
  else logFail('Test 10 - Empty/invalid name', 'HTTP 400', res.status);

  // TEST 11 — ATTEMPT ROLE ESCALATION
  res = await makeRequest('PUT', '/api/users/profile', { name: 'Security Test', role: 'admin' }, regularToken);
  if (res.status === 400 || res.status === 403) {
    logPass('Test 11 - Attempt role escalation');
  } else {
    // If it succeeded but ignored the role, check the profile
    const profileRes = await makeRequest('GET', '/api/users/profile', null, regularToken);
    if (profileRes.data?.user?.role === 'user') {
      logPass('Test 11 - Attempt role escalation');
    } else {
      logFail('Test 11 - Attempt role escalation', 'Role should not be admin', profileRes.data?.user?.role);
    }
  }

  // TEST 12 — ATTEMPT PROTECTED FIELD MODIFICATION
  res = await makeRequest('PUT', '/api/users/profile', { _id: 'fake_id', password: 'newPassword', role: 'admin' }, regularToken);
  if (res.status === 400) {
    logPass('Test 12 - Attempt protected field modification');
  } else {
    logFail('Test 12 - Attempt protected field modification', 'HTTP 400', res.status);
  }

  // TEST 13 — CHANGE PASSWORD WITH WRONG CURRENT PASSWORD
  res = await makeRequest('PUT', '/api/users/change-password', { currentPassword: 'wrongpassword', newPassword: 'newpassword123' }, regularToken);
  if (res.status === 400 || res.status === 401) logPass('Test 13 - Change password with wrong current password');
  else logFail('Test 13 - Change password with wrong current password', 'HTTP 400 or 401', res.status);

  // TEST 14 — CHANGE PASSWORD WITH MISSING FIELDS
  res = await makeRequest('PUT', '/api/users/change-password', { newPassword: 'newpassword123' }, regularToken);
  if (res.status === 400) logPass('Test 14 - Change password with missing fields');
  else logFail('Test 14 - Change password with missing fields', 'HTTP 400', res.status);

  // TEST 15 — CHANGE PASSWORD SUCCESSFULLY
  res = await makeRequest('PUT', '/api/users/change-password', { currentPassword: regularUser.password, newPassword: 'newpassword123' }, regularToken);
  if (res.status === 200) logPass('Test 15 - Change password successfully');
  else logFail('Test 15 - Change password successfully', 'HTTP 200', res.status);

  // TEST 16 — VERIFY OLD PASSWORD NO LONGER WORKS
  res = await makeRequest('POST', '/api/auth/login', { email: 'yagnik_new@test.com', password: regularUser.password });
  if (res.status === 401) logPass('Test 16 - Verify old password no longer works');
  else logFail('Test 16 - Verify old password no longer works', 'HTTP 401', res.status);

  // TEST 17 — VERIFY NEW PASSWORD WORKS
  let newLoginToken = null;
  res = await makeRequest('POST', '/api/auth/login', { email: 'yagnik_new@test.com', password: 'newpassword123' });
  if (res.status === 200 && res.data?.token) {
    newLoginToken = res.data.token;
    logPass('Test 17 - Verify new password works');
  } else {
    logFail('Test 17 - Verify new password works', 'HTTP 200', res.status);
  }

  // TEST 18 — VERIFY NEW LOGIN DOES NOT EXPOSE PASSWORD
  if (newLoginToken) {
    const user = res.data.user;
    if (!user.password && !JSON.stringify(res.data).includes('newpassword123') && !JSON.stringify(res.data).includes('$2a$')) {
      logPass('Test 18 - Verify new login does not expose password');
    } else {
      logFail('Test 18 - Verify new login does not expose password', 'No password exposed', 'Password exposed');
    }
  } else {
    logSkip('Test 18 - Verify new login does not expose password', 'No new login token');
  }

  // TEST 19 — CROSS-USER PROFILE MODIFICATION PROTECTION
  if (user2Token && user2Id && regularUserId) {
    res = await makeRequest('PUT', `/api/users/profile`, { _id: regularUserId, name: 'Hacked Name' }, user2Token);
    
    // Check if the regular user's name was changed.
    const checkRes = await makeRequest('GET', '/api/users/profile', null, regularToken);
    if (checkRes.data?.user?.name !== 'Hacked Name') {
      logPass('Test 19 - Cross-user profile modification protection');
    } else {
      logFail('Test 19 - Cross-user profile modification protection', 'Original name', checkRes.data?.user?.name);
    }
  } else {
    logSkip('Test 19 - Cross-user profile modification protection', 'Missing tokens');
  }

  // TEST 20 — UNAUTHENTICATED CHANGE PASSWORD
  res = await makeRequest('PUT', '/api/users/change-password', { currentPassword: 'newpassword123', newPassword: 'password123' });
  if (res.status === 401) logPass('Test 20 - Unauthenticated change password');
  else logFail('Test 20 - Unauthenticated change password', 'HTTP 401', res.status);

  // TEST 21 — UNAUTHENTICATED PROFILE UPDATE
  res = await makeRequest('PUT', '/api/users/profile', { name: 'Yagnik' });
  if (res.status === 401) logPass('Test 21 - Unauthenticated profile update');
  else logFail('Test 21 - Unauthenticated profile update', 'HTTP 401', res.status);

  // TEST 22 — SERVER STABILITY
  res = await makeRequest('GET', '/api/health');
  if (res.status === 200) logPass('Test 22 - Server stability');
  else logFail('Test 22 - Server stability', 'HTTP 200', res.status);

  // TEST 23 — EXISTING MODULE REGRESSION
  const r1 = await makeRequest('GET', '/api/stadiums');
  const r2 = await makeRequest('GET', '/api/bookings/my', null, regularToken);
  const r3 = await makeRequest('GET', '/api/admin/dashboard', null, adminToken);
  
  if (r1.status === 200 && r2.status === 200 && r3.status === 200) {
    logPass('Test 23 - Existing Module Regression');
  } else {
    logFail('Test 23 - Existing Module Regression', 'All HTTP 200', `Status: ${r1.status}, ${r2.status}, ${r3.status}`);
  }

  // CLEANUP
  console.log('\n--- CLEANUP ---');
  // Restore original profile name and email
  await makeRequest('PUT', '/api/users/profile', { name: 'Yagnik Vithlani', email: regularUser.email }, regularToken);
  // Restore original password
  await makeRequest('PUT', '/api/users/change-password', { currentPassword: 'newpassword123', newPassword: regularUser.password }, regularToken);
  console.log('Restored test user data successfully.');

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
