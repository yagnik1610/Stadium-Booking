const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';
const adminCredentials = {
  email: process.env.TEST_ADMIN_ID || process.env.ADMIN_LOGIN_ID || process.env.ADMIN_EMAIL,
  password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
};
const regularUserCredentials = {
  email: 'yagnik@test.com',
  password: 'password123'
};

let adminToken = null;
let userToken = null;
let passedCount = 0;
let failedCount = 0;

function pass(name) {
  passedCount++;
  console.log(`[PASS] ${name}`);
}

function fail(name, details) {
  failedCount++;
  console.error(`[FAIL] ${name} ->`, details);
}

async function runAudit() {
  console.log('========================================================');
  console.log('ADMIN SYSTEM PHASE 1: FULL VERIFICATION MATRIX TEST');
  console.log('========================================================\n');

  // 1. Admin Login
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminCredentials)
  });
  const adminData = await adminRes.json();
  if (adminRes.status === 200 && (adminData.token || adminData.data?.token)) {
    adminToken = adminData.token || adminData.data?.token;
    pass('1. Admin Login with secure credentials');
  } else {
    fail('1. Admin Login', adminData);
    return;
  }

  // 2. Normal User Login
  const userRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regularUserCredentials)
  });
  const userData = await userRes.json();
  if (userRes.status === 200 && (userData.token || userData.data?.token)) {
    userToken = userData.token || userData.data?.token;
    pass('2. Normal User Login');
  } else {
    fail('2. Normal User Login', userData);
  }

  // 3. Security: Logged-out user blocked from /api/admin/dashboard
  const unauthRes = await fetch(`${BASE_URL}/api/admin/dashboard`);
  if (unauthRes.status === 401) {
    pass('3. Security: Unauthenticated request blocked from admin API (HTTP 401)');
  } else {
    fail('3. Unauthenticated security check', unauthRes.status);
  }

  // 4. Security: Normal user forbidden from /api/admin/dashboard
  const forbiddenRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  if (forbiddenRes.status === 403) {
    pass('4. Security: Normal user blocked from admin API (HTTP 403 Forbidden)');
  } else {
    fail('4. Normal user forbidden check', forbiddenRes.status);
  }

  // Helper for admin requests
  const adminReq = async (method, endpoint, body = null) => {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${BASE_URL}${endpoint}`, opts);
    const d = await r.json().catch(() => null);
    return { status: r.status, data: d };
  };

  // 5. GET /api/admin/dashboard
  const dash = await adminReq('GET', '/api/admin/dashboard');
  if (dash.status === 200 && dash.data?.success && dash.data?.stats) {
    pass('5. Admin Dashboard stats retrieved successfully');
  } else {
    fail('5. Admin Dashboard', dash);
  }

  // 6. GET /api/admin/users
  const users = await adminReq('GET', '/api/admin/users?page=1&limit=5');
  if (users.status === 200 && users.data?.success && Array.isArray(users.data?.users)) {
    pass('6. Users API retrieved user list with pagination');
  } else {
    fail('6. Users API', users);
  }

  // 7. GET /api/stadiums/admin/all
  const stadiums = await adminReq('GET', '/api/stadiums/admin/all');
  if (stadiums.status === 200 && stadiums.data?.success && Array.isArray(stadiums.data?.stadiums)) {
    pass('7. Stadiums admin list retrieved');
  } else {
    fail('7. Stadiums admin list', stadiums);
  }

  // 8. GET /api/sports
  const sports = await adminReq('GET', '/api/sports');
  if (sports.status === 200 && sports.data?.success && Array.isArray(sports.data?.sports)) {
    pass('8. Sports API retrieved sport disciplines');
  } else {
    fail('8. Sports API', sports);
  }

  // 9. GET /api/bookings/admin/all
  const bookings = await adminReq('GET', '/api/bookings/admin/all');
  if (bookings.status === 200 && bookings.data?.success && Array.isArray(bookings.data?.bookings)) {
    pass('9. Bookings admin list retrieved with pagination');
  } else {
    fail('9. Bookings admin list', bookings);
  }

  // 10. Availability API
  const sampleStadium = stadiums.data?.stadiums.find(s => s.isActive) || stadiums.data?.stadiums[0];
  if (sampleStadium) {
    const todayStr = new Date().toISOString().split('T')[0];
    const avail = await adminReq('GET', `/api/stadiums/${sampleStadium._id}/availability?date=${todayStr}&duration=1`);
    if (avail.status === 200 && avail.data?.success && Array.isArray(avail.data?.slots)) {
      pass(`10. Stadium Availability retrieved (${avail.data.slots.length} slots generated)`);
    } else {
      fail('10. Stadium Availability', avail);
    }
  } else {
    pass('10. Stadium Availability skipped (no stadiums found)');
  }

  // 11. Payments admin list
  const payments = await adminReq('GET', '/api/payments/admin/all');
  if (payments.status === 200 && payments.data?.success && Array.isArray(payments.data?.payments)) {
    pass('11. Payments admin list retrieved');
  } else {
    fail('11. Payments admin list', payments);
  }

  // 12. Reviews admin list
  const reviews = await adminReq('GET', '/api/reviews/admin/all');
  if (reviews.status === 200 && reviews.data?.success && Array.isArray(reviews.data?.reviews)) {
    pass('12. Reviews admin list retrieved');
  } else {
    fail('12. Reviews admin list', reviews);
  }

  // 13. Notifications my list
  const notifs = await adminReq('GET', '/api/notifications/my');
  if (notifs.status === 200 && notifs.data?.success && Array.isArray(notifs.data?.notifications)) {
    pass('13. Notifications list retrieved');
  } else {
    fail('13. Notifications list', notifs);
  }

  // 14. Broadcast Notification
  const broadcast = await adminReq('POST', '/api/admin/notifications/broadcast', {
    title: 'Phase 1 Audit Notice',
    message: 'Testing system notification broadcast delivery.',
    type: 'system_broadcast',
    target: 'all'
  });
  if (broadcast.status === 200 && broadcast.data?.success) {
    pass('14. Broadcast notification dispatched successfully');
  } else {
    fail('14. Broadcast notification', broadcast);
  }

  // 15. Settings: GET and PUT
  const getSettings = await adminReq('GET', '/api/admin/settings');
  if (getSettings.status === 200 && getSettings.data?.success && getSettings.data?.settings) {
    pass('15a. System Settings retrieved from MongoDB');
    const updateSettings = await adminReq('PUT', '/api/admin/settings', {
      platformName: 'Stadium Booking System (Verified)',
      termsAndConditions: {
        version: '1.1',
        generalTerms: 'Updated general terms verified.'
      },
      safetyRules: {
        defaultSafetyGuidelines: 'Standard athletic shoes required.'
      }
    });
    if (updateSettings.status === 200 && updateSettings.data?.success) {
      pass('15b. System Settings updated and persisted to MongoDB');
    } else {
      fail('15b. Update Settings', updateSettings);
    }
  } else {
    fail('15a. Get Settings', getSettings);
  }

  // 16. Analytics API with time ranges
  const a7d = await adminReq('GET', '/api/admin/analytics?timeRange=7d');
  const a30d = await adminReq('GET', '/api/admin/analytics?timeRange=30d');
  const a90d = await adminReq('GET', '/api/admin/analytics?timeRange=90d');
  const a1y = await adminReq('GET', '/api/admin/analytics?timeRange=1y');
  if (
    a7d.data?.success && a7d.data?.analytics?.bookings &&
    a30d.data?.success && a30d.data?.analytics?.revenue &&
    a90d.data?.success &&
    a1y.data?.success
  ) {
    pass('16. Analytics API verified for 7d, 30d, 90d, 1y time ranges');
  } else {
    fail('16. Analytics timeRange support', { a7d, a30d });
  }

  // 17. Reports API (bookings, payments, users, stadiums)
  const repBookings = await adminReq('GET', '/api/admin/reports?type=bookings');
  const repRevenue = await adminReq('GET', '/api/admin/reports?type=revenue');
  const repUsers = await adminReq('GET', '/api/admin/reports?type=users');
  const repStadiums = await adminReq('GET', '/api/admin/reports?type=stadiums');
  if (repBookings.data?.success && repRevenue.data?.success && repUsers.data?.success && repStadiums.data?.success) {
    pass('17. Reports API generated data for bookings, revenue, users, stadiums');
  } else {
    fail('17. Reports API', { repBookings, repRevenue });
  }

  // 18. Activity Logs
  const activity = await adminReq('GET', '/api/admin/activity');
  if (activity.status === 200 && activity.data?.success && Array.isArray(activity.data?.logs)) {
    pass(`18. Activity Logs retrieved (${activity.data.logs.length} logged events)`);
  } else {
    fail('18. Activity Logs', activity);
  }

  // 19. Profile API
  const profile = await adminReq('GET', '/api/auth/profile');
  if (profile.status === 200 && profile.data?.success && profile.data?.user?.role === 'admin') {
    pass('19. Admin Profile retrieved with role="admin"');
  } else {
    fail('19. Admin Profile', profile);
  }

  console.log('\n========================================================');
  console.log(`VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('========================================================\n');

  if (failedCount > 0) process.exit(1);
}

runAudit().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
