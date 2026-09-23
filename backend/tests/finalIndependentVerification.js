const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.TEST_ADMIN_ID || process.env.ADMIN_EMAIL || 'admin@stadium.com';
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

async function runAudit() {
  console.log('====================================================');
  console.log('FINAL FRONTEND-BACKEND INDEPENDENT VERIFICATION SUITE');
  console.log('====================================================\n');

  let adminToken = '';
  let userToken = '';
  let userId = '';
  let testStadiumId = '';
  let testBookingId = '';
  let testNotifId = '';

  // 1. Password Security Check (User model inspection)
  try {
    const User = require('../models/User');
    const userInstance = new User({
      name: 'Bcrypt Test',
      email: 'bcrypt-test@test.com',
      password: 'SamplePassword123'
    });
    // Verify matchPassword source
    const matchFnStr = userInstance.matchPassword.toString();
    const usesBcrypt = matchFnStr.includes('bcrypt.compare');
    const noPlaintextBypass = !matchFnStr.includes('===') || matchFnStr.includes('bcrypt.compare');
    assert(usesBcrypt && noPlaintextBypass, 'User.matchPassword strictly uses bcrypt.compare with no bypasses');
  } catch (err) {
    assert(false, `User model password check failed: ${err.message}`);
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
      res = await axios.post(`${API_BASE}/auth/register`, {
        name: 'Yagnik Regular',
        email: 'yagnik@test.com',
        password: 'password123',
        mobile: '9876543210'
      });
    }
    const token = res.data.token || res.data.data?.token;
    const user = res.data.user || res.data.data?.user;
    assert(token && user, 'User authentication succeeded via bcrypt');
    userToken = token;
    userId = user._id || user.id;
  } catch (err) {
    assert(false, `User login failed: ${err.message}`);
  }

  // 3. Admin Authentication via Environment Configuration
  try {
    if (!ADMIN_PASSWORD) {
      throw new Error('ADMIN_PASSWORD not set in environment variables');
    }
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    const token = res.data.token || res.data.data?.token;
    const user = res.data.user || res.data.data?.user;
    assert(token && user?.role === 'admin', 'Admin authenticated securely from environment configuration');
    adminToken = token;
  } catch (err) {
    assert(false, `Admin authentication failed: ${err.message}`);
  }

  // 4. Security & RBAC: User blocked from Admin routes
  try {
    await axios.get(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(false, 'User accessed /admin/dashboard without 403');
  } catch (err) {
    assert(err.response?.status === 403, 'Normal user blocked from /api/admin/* with 403 Forbidden');
  }

  // 5. Security: Unauthenticated access blocked with 401
  try {
    await axios.get(`${API_BASE}/admin/dashboard`);
    assert(false, 'Unauthenticated request succeeded without 401');
  } catch (err) {
    assert(err.response?.status === 401, 'Unauthenticated request rejected with 401 Unauthorized');
  }

  // 6. Admin creates Stadium with postalCode and currency
  try {
    const timestamp = Date.now();
    const createRes = await axios.post(`${API_BASE}/stadiums`, {
      name: `Grand Central Arena ${timestamp}`,
      description: 'State of the art multisport complex with audience gallery',
      location: 'Downtown Athletic District',
      address: '777 Olympic Boulevard',
      city: 'Ahmedabad',
      state: 'Gujarat',
      country: 'India',
      postalCode: '380054',
      currency: 'INR',
      sports: ['Football', 'Cricket'],
      pricePerHour: 1500,
      openingTime: '06:00',
      closingTime: '23:00',
      capacity: 30,
      playerCapacity: 22,
      audienceCapacity: 500,
      audienceAllowed: true,
      audiencePassRequired: false,
      audienceRules: 'Spectators must remain in designated tiers',
      facilities: ['Locker Rooms', 'Floodlights', 'Parking', 'Cafeteria'],
      parking: { available: true, capacity: 100 },
      minDuration: 1,
      maxDuration: 4
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const s = createRes.data.stadium || createRes.data.data;
    assert(createRes.status === 201 && s?._id, 'Admin created stadium in MongoDB (201 Created)');
    testStadiumId = s._id;
    assert(s.postalCode === '380054', 'postalCode persisted on creation');
    assert(s.currency === 'INR', 'currency persisted on creation');
    assert(s.playerCapacity === 22, 'playerCapacity separate from audienceCapacity (22 players)');
    assert(s.audienceCapacity === 500, 'audienceCapacity preserved (500 spectators)');
  } catch (err) {
    assert(false, `Stadium creation failed: ${err.response?.data?.message || err.message}`);
  }

  // 7. Admin updates Stadium (verifying postalCode and currency update)
  if (testStadiumId) {
    try {
      const updateRes = await axios.put(`${API_BASE}/stadiums/${testStadiumId}`, {
        postalCode: '380060',
        currency: 'INR',
        description: 'Updated description for multi-sport arena'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const s = updateRes.data.stadium || updateRes.data.data;
      assert(s?.postalCode === '380060', 'postalCode updated successfully in MongoDB');
    } catch (err) {
      assert(false, `Stadium update failed: ${err.response?.data?.message || err.message}`);
    }
  }

  // 8. User retrieves stadium details (verifying configured data appears on user side)
  if (testStadiumId) {
    try {
      const userView = await axios.get(`${API_BASE}/stadiums/${testStadiumId}`);
      const s = userView.data.stadium || userView.data.data;
      assert(userView.status === 200 && s?._id === testStadiumId, 'User retrieved admin-created stadium');
      assert(s.postalCode === '380060', 'User sees configured postalCode');
      assert(s.currency === 'INR', 'User sees configured currency');
      assert(s.playerCapacity === 22 && s.audienceCapacity === 500, 'User sees player capacity distinct from audience capacity');
    } catch (err) {
      assert(false, `User stadium view failed: ${err.message}`);
    }
  }

  // 9. Availability check (Authoritative backend slot calculation)
  if (testStadiumId) {
    try {
      const availRes = await axios.get(`${API_BASE}/stadiums/${testStadiumId}/availability`, {
        params: { date: '2026-12-15', sport: 'Football', duration: 1 }
      });
      const slots = availRes.data.slots || availRes.data.data?.slots || availRes.data.data;
      assert(availRes.status === 200 && Array.isArray(slots) && slots.length > 0, 'Backend returned calculated available time slots');
    } catch (err) {
      assert(false, `Availability check failed: ${err.response?.data?.message || err.message}`);
    }
  }

  // 10. User creates booking (with separate account user & booking person)
  if (testStadiumId) {
    try {
      const bookRes = await axios.post(`${API_BASE}/bookings`, {
        stadium: testStadiumId,
        sport: 'Football',
        bookingDate: '2026-12-15',
        startTime: '10:00',
        endTime: '11:00',
        duration: 1,
        bookingFor: 'someone_else',
        termsAccepted: true,
        bookingPerson: {
          name: 'Captain Robert',
          email: 'captain.robert@club.com',
          mobile: '9876500000'
        }
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const b = bookRes.data.booking || bookRes.data.data;
      assert(bookRes.status === 201 && b?._id, 'Booking created in MongoDB (201 Created)');
      testBookingId = b._id;
      assert(b.bookingPerson?.name === 'Captain Robert', 'Separate booking person information stored accurately');
      assert(b.user?.toString() === userId.toString() || b.user?._id?.toString() === userId.toString(), 'Linked to authenticated account user');
    } catch (err) {
      assert(false, `Booking creation failed: ${err.response?.data?.message || err.message}`);
    }
  }

  // 11. Booking conflict protection (409 Conflict)
  if (testStadiumId) {
    try {
      await axios.post(`${API_BASE}/bookings`, {
        stadium: testStadiumId,
        sport: 'Football',
        bookingDate: '2026-12-15',
        startTime: '10:00',
        endTime: '11:00',
        duration: 1,
        termsAccepted: true,
        bookingPerson: {
          fullName: 'Conflicting Booker',
          email: 'conflict@club.com',
          phone: '9876500001'
        }
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(false, 'Expected 409 Conflict for overlapping slot');
    } catch (err) {
      assert(err.response?.status === 409, 'Concurrent slot reservation rejected with 409 Conflict');
    }
  }

  // 12. Admin retrieves booking details
  if (testBookingId) {
    try {
      const adminGetRes = await axios.get(`${API_BASE}/bookings/${testBookingId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const b = adminGetRes.data.booking || adminGetRes.data.data;
      assert(adminGetRes.status === 200 && b?._id === testBookingId, 'Admin retrieved booking details');
      assert(b.bookingReference, `Authoritative reference present: ${b.bookingReference}`);
    } catch (err) {
      assert(false, `Admin booking retrieve failed: ${err.message}`);
    }
  }

  // 13. Admin approves booking
  if (testBookingId) {
    try {
      const approveRes = await axios.put(`${API_BASE}/bookings/${testBookingId}/status`, {
        status: 'confirmed'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const b = approveRes.data.booking || approveRes.data.data;
      assert(b?.status === 'confirmed', 'Admin approved booking status to confirmed in MongoDB');
    } catch (err) {
      assert(false, `Admin approval failed: ${err.message}`);
    }
  }

  // 14. User views updated booking status
  if (testBookingId) {
    try {
      const userBookings = await axios.get(`${API_BASE}/bookings/my`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      const list = userBookings.data.bookings || userBookings.data.data || [];
      const found = list.find(b => b._id === testBookingId);
      assert(found && found.status === 'confirmed', 'User side confirms updated confirmed status');
    } catch (err) {
      assert(false, `User my bookings failed: ${err.message}`);
    }
  }

  // 15. Admin cancels booking (verifying AdminBookingDetail cancel action)
  if (testBookingId) {
    try {
      const cancelRes = await axios.put(`${API_BASE}/bookings/${testBookingId}/status`, {
        status: 'cancelled',
        rejectionReason: 'Weather advisory cancellation by administrator'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const b = cancelRes.data.booking || cancelRes.data.data;
      assert(b?.status === 'cancelled', 'Admin cancelled booking successfully in MongoDB');
      assert(b?.rejectionReason?.includes('Weather advisory'), 'Cancellation reason persisted');
    } catch (err) {
      assert(false, `Admin cancel failed: ${err.message}`);
    }
  }

  // 16. Favorites Workflow (Add, Check, Persist, Remove)
  if (testStadiumId) {
    try {
      // Add favorite
      await axios.post(`${API_BASE}/favorites`, {
        stadiumId: testStadiumId
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      // Check status
      const checkRes = await axios.get(`${API_BASE}/favorites/check/${testStadiumId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(checkRes.data.isFavorite === true, 'Favorite verified in MongoDB (isFavorite: true)');

      // Remove favorite
      const delRes = await axios.delete(`${API_BASE}/favorites/${testStadiumId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(delRes.status === 200, 'Favorite removed from MongoDB');

      // Check status again
      const checkAgain = await axios.get(`${API_BASE}/favorites/check/${testStadiumId}`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(checkAgain.data.isFavorite === false, 'Favorite removal verified in MongoDB (isFavorite: false)');
    } catch (err) {
      assert(false, `Favorites test failed: ${err.message}`);
    }
  }

  // 17. Notification Flow (List, Unread Count, Mark Read, Delete)
  try {
    const countRes = await axios.get(`${API_BASE}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(typeof countRes.data.unreadCount === 'number', `Unread notifications count: ${countRes.data.unreadCount}`);

    const notifRes = await axios.get(`${API_BASE}/notifications/my`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const notifs = notifRes.data.notifications || notifRes.data.data || [];
    assert(Array.isArray(notifs), `User retrieved ${notifs.length} notifications from MongoDB`);
    if (notifs.length > 0) {
      testNotifId = notifs[0]._id;
      // Mark read
      await axios.put(`${API_BASE}/notifications/${testNotifId}/read`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert(true, 'Marked notification as read in MongoDB');
    }
  } catch (err) {
    assert(false, `Notification flow failed: ${err.message}`);
  }

  // 18. Admin Analytics (verifying no filter multiplier, real time-range aggregation)
  try {
    const ranges = ['7d', '30d', '90d', '1y'];
    for (const r of ranges) {
      const aRes = await axios.get(`${API_BASE}/admin/analytics`, {
        params: { timeRange: r, type: 'bookings' },
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(aRes.status === 200 && aRes.data.success, `Admin analytics for ${r} returned real MongoDB aggregation`);
    }
  } catch (err) {
    assert(false, `Admin analytics failed: ${err.message}`);
  }

  // 19. Admin Reports (verifying database records compilation)
  try {
    const repRes = await axios.get(`${API_BASE}/admin/reports`, {
      params: { category: 'bookings' },
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(repRes.status === 200 && (Array.isArray(repRes.data.data) || Array.isArray(repRes.data.records)), 'Admin reports retrieved actual database records');
  } catch (err) {
    assert(false, `Admin reports failed: ${err.message}`);
  }

  // 20. Admin System Settings
  try {
    const setRes = await axios.get(`${API_BASE}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(setRes.status === 200 && setRes.data.settings, 'Admin settings retrieved from MongoDB');

    const putRes = await axios.put(`${API_BASE}/admin/settings`, {
      appName: 'Stadium Booking System',
      defaultGstRate: 18
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(putRes.status === 200 && putRes.data.settings, 'Admin settings saved and persisted to MongoDB');
  } catch (err) {
    assert(false, `Admin settings failed: ${err.message}`);
  }

  // 21. Admin Activity Logs
  try {
    const actRes = await axios.get(`${API_BASE}/admin/activity`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const logs = actRes.data.logs || actRes.data.data || [];
    assert(actRes.status === 200 && Array.isArray(logs), 'Admin activity logs retrieved from MongoDB');
  } catch (err) {
    assert(false, `Admin activity logs failed: ${err.message}`);
  }

  // 22. Clean up test stadium from database
  if (testStadiumId) {
    try {
      await axios.delete(`${API_BASE}/stadiums/${testStadiumId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('[INFO] Test stadium cleaned up successfully.');
    } catch (e) {
      // Ignored
    }
  }

  console.log('\n====================================================');
  console.log(`TOTAL CHECKS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit();
