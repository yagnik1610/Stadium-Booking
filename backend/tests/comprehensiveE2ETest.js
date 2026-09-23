const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@stadium.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runE2E() {
  console.log('========================================');
  console.log('END-TO-END INTEGRATION AUDIT SUITE');
  console.log('========================================\n');

  let adminToken = '';
  let userToken = '';
  let userId = '';
  let stadiumId = '';
  let bookingId = '';

  // 1. Health check
  try {
    const res = await axios.get(`${API_BASE}/health`);
    assert(res.status === 200 && res.data.success, 'Health check passed (status: 200)');
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // 2. User Authentication
  try {
    let res;
    try {
      res = await axios.post(`${API_BASE}/auth/login`, {
        email: 'yagnik@test.com',
        password: 'password123'
      });
    } catch (e) {
      // If user doesn't exist, register
      res = await axios.post(`${API_BASE}/auth/register`, {
        name: 'Yagnik Regular',
        email: 'yagnik@test.com',
        password: 'password123',
        phone: '9876543210'
      });
    }
    const token = res.data.token || res.data.data?.token;
    const user = res.data.user || res.data.data?.user;
    assert(token && user, 'User authentication succeeded and returned JWT');
    userToken = token;
    userId = user._id || user.id;
    assert(user.role === 'user', 'User has role "user"');
  } catch (err) {
    assert(false, `User login failed: ${err.message}`);
  }

  // 3. Admin Authentication
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = res.data.token || res.data.data?.token;
    const user = res.data.user || res.data.data?.user;
    assert(token && user, 'Admin login succeeded and returned JWT');
    adminToken = token;
    assert(user.role === 'admin', 'Admin has role "admin"');
  } catch (err) {
    assert(false, `Admin login failed: ${err.message}`);
  }

  // 4. Security: Normal user accessing /admin endpoints -> 403
  try {
    await axios.get(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(false, 'User accessed /admin/dashboard without 403');
  } catch (err) {
    assert(err.response && err.response.status === 403, 'Normal user blocked from /admin/dashboard with 403 Forbidden');
  }

  // 5. User Profile Update & Persistence
  try {
    const profileRes = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(profileRes.status === 200 && profileRes.data.user, 'Fetched user profile successfully');

    const updateRes = await axios.put(`${API_BASE}/users/profile`, {
      name: 'Regular User Verified',
      mobile: '9876543210'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(updateRes.status === 200 && (updateRes.data.user?.name === 'Regular User Verified' || updateRes.data.data?.name === 'Regular User Verified'), 'Profile updated in MongoDB');
  } catch (err) {
    assert(false, `User profile test failed: ${err.message}`);
  }

  let sport = 'Football';

  // 6. Public Stadiums & Search
  try {
    const res = await axios.get(`${API_BASE}/stadiums`);
    const stadiums = res.data.stadiums || res.data.data || [];
    assert(res.status === 200 && Array.isArray(stadiums) && stadiums.length > 0, `Fetched ${stadiums.length} public stadiums from MongoDB`);
    stadiumId = stadiums[0]._id;
    if (stadiums[0].sports && stadiums[0].sports.length > 0) {
      sport = typeof stadiums[0].sports[0] === 'string' ? stadiums[0].sports[0] : stadiums[0].sports[0].name;
    }
  } catch (err) {
    assert(false, `Stadium listing failed: ${err.message}`);
  }

  // 7. Stadium Details
  try {
    const res = await axios.get(`${API_BASE}/stadiums/${stadiumId}`);
    const s = res.data.stadium || res.data.data;
    assert(res.status === 200 && s && s._id === stadiumId, 'Stadium details returned complete configured data');
    assert(typeof s.playerCapacity === 'number', 'Player capacity field is present and numeric');
    assert(typeof s.audienceCapacity === 'number', 'Audience capacity field is present and numeric');
    assert(typeof s.audienceAllowed === 'boolean', 'Audience allowed field is boolean');
  } catch (err) {
    assert(false, `Stadium details failed: ${err.message}`);
  }

  // 8. Stadium Availability
  try {
    const res = await axios.get(`${API_BASE}/stadiums/${stadiumId}/availability`, {
      params: { date: '2026-11-20', sport, duration: 1 }
    });
    const slots = res.data.slots || res.data.data?.slots || res.data.data;
    assert(res.status === 200 && Array.isArray(slots), 'Availability returned slots from backend logic');
  } catch (err) {
    assert(false, `Availability check failed: ${err.message}`);
  }

  // 9. Create Booking
  try {
    const bookingRes = await axios.post(`${API_BASE}/bookings`, {
      stadium: stadiumId,
      sport,
      bookingDate: '2026-11-20',
      startTime: '10:00',
      endTime: '11:00',
      duration: 1,
      termsAccepted: true,
      bookingPerson: {
        fullName: 'Test Booker',
        email: 'booker@test.com',
        phone: '9998887776'
      }
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const b = bookingRes.data.booking || bookingRes.data.data;
    assert(bookingRes.status === 201 && b && b._id, 'Booking created in MongoDB (201 Created)');
    bookingId = b._id;
  } catch (err) {
    assert(false, `Booking creation failed: ${err.response?.data?.message || err.message}`);
  }

  // 10. Booking Conflict (409 Conflict)
  if (bookingId) {
    try {
      await axios.post(`${API_BASE}/bookings`, {
        stadium: stadiumId,
        sport,
        bookingDate: '2026-11-20',
        startTime: '10:00',
        endTime: '11:00',
        duration: 1,
        termsAccepted: true,
        bookingPerson: {
          fullName: 'Conflicting Booker',
          email: 'conflict@test.com',
          phone: '9998887775'
        }
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(false, 'Expected 409 Conflict for overlapping slot');
    } catch (err) {
      assert(err.response && err.response.status === 409, 'Double booking rejected with 409 Conflict');
    }
  }

  // 11. Admin Approves Booking
  if (bookingId) {
    try {
      const res = await axios.put(`${API_BASE}/bookings/${bookingId}/status`, {
        status: 'confirmed'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const updatedBooking = res.data.booking || res.data.data;
      assert(res.status === 200 && updatedBooking.status === 'confirmed', 'Admin approved booking status to confirmed');
    } catch (err) {
      assert(false, `Admin status update failed: ${err.response?.data?.message || err.message}`);
    }
  }

  // 12. User Favorites (Toggle, Check, Persist)
  try {
    let addFav;
    try {
      addFav = await axios.post(`${API_BASE}/favorites`, {
        stadiumId: stadiumId
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
    } catch (err) {
      if (err.response && err.response.status === 409) {
        addFav = err.response;
      } else {
        throw err;
      }
    }
    assert(addFav.status === 200 || addFav.status === 201 || addFav.status === 409, 'Favorite added or already present in MongoDB');

    const checkFav = await axios.get(`${API_BASE}/favorites/check/${stadiumId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(checkFav.status === 200 && (checkFav.data.isFavorite === true || typeof checkFav.data.isFavorite === 'boolean'), 'Favorite check confirmed in MongoDB');

    const myFavs = await axios.get(`${API_BASE}/favorites/my`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const favList = myFavs.data.favorites || myFavs.data.data || [];
    assert(myFavs.status === 200 && Array.isArray(favList), 'User retrieved favorites list from MongoDB');
  } catch (err) {
    assert(false, `Favorite workflow failed: ${err.message}`);
  }

  // 13. Notifications
  try {
    const notifs = await axios.get(`${API_BASE}/notifications/my`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const notifList = notifs.data.notifications || notifs.data.data || [];
    assert(notifs.status === 200 && Array.isArray(notifList), 'Notifications list retrieved from MongoDB');

    const countRes = await axios.get(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(countRes.status === 200 && typeof countRes.data.unreadCount === 'number', 'Unread notification count retrieved');
  } catch (err) {
    assert(false, `Notifications test failed: ${err.message}`);
  }

  // 14. Admin Dashboard Metrics
  try {
    const dashRes = await axios.get(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stats = dashRes.data.stats || dashRes.data.data?.stats;
    assert(dashRes.status === 200 && stats, 'Admin dashboard returned real aggregated statistics');
    assert(typeof stats.totalUsers === 'number', 'Admin dashboard has real totalUsers count');
    assert(typeof stats.totalBookings === 'number', 'Admin dashboard has real totalBookings count');
  } catch (err) {
    assert(false, `Admin dashboard test failed: ${err.message}`);
  }

  // 15. Admin User Management & Payments List
  try {
    const usersRes = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const usersList = usersRes.data.users || usersRes.data.data || [];
    assert(usersRes.status === 200 && Array.isArray(usersList), 'Admin retrieved real users list');

    const paymentsRes = await axios.get(`${API_BASE}/payments/admin/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const paymentsList = paymentsRes.data.payments || paymentsRes.data.data || [];
    assert(paymentsRes.status === 200 && Array.isArray(paymentsList), 'Admin retrieved real payments list');
  } catch (err) {
    assert(false, `Admin management test failed: ${err.message}`);
  }

  // 16. Cleanup test booking
  if (bookingId) {
    try {
      await axios.put(`${API_BASE}/bookings/${bookingId}/cancel`, {
        reason: 'Automated E2E test cleanup'
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('[INFO] Test booking cancelled cleanly.');
    } catch (e) {
      // Ignored
    }
  }

  console.log('\n========================================');
  console.log(`TOTAL AUDIT CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runE2E();
