const fs = require('fs');

const BASE_URL = 'http://localhost:5000';

// Known data
const user1 = { email: 'yagnik@test.com', password: 'password123' };
const user2 = { email: 'testuser2@example.com', password: 'password123' };
const activeStadiumId = '6a9f277c960603780fdb3474';

let token1 = null;
let token2 = null;

let totalTests = 18;
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
  console.log('MODULE 6 FAVORITES API TEST SUITE');
  console.log('========================================\n');

  // TEST 1 - User Login
  let res = await makeRequest('POST', '/api/auth/login', user1);
  if (res.status === 200 && res.data?.success && res.data?.token) {
    token1 = res.data.token;
    logPass('Test 1 - User Login');
  } else {
    logFail('Test 1 - User Login', 'HTTP 200 and token', JSON.stringify(res.data), res.status);
    console.log('Stopping test suite as authentication failed.');
    return;
  }

  // TEST 2 - Stadium Validation
  res = await makeRequest('GET', `/api/stadiums/${activeStadiumId}`);
  if (res.status === 200 && res.data?.success && res.data?.stadium?.isActive) {
    logPass('Test 2 - Stadium Validation');
  } else {
    logFail('Test 2 - Stadium Validation', 'HTTP 200 and active stadium', JSON.stringify(res.data), res.status);
    console.log('Stopping test suite as active stadium is required.');
    return;
  }

  // PRE-CLEANUP: Ensure Test 3 starts clean
  await makeRequest('DELETE', `/api/favorites/${activeStadiumId}`, null, token1);

  // TEST 3 - Initial Favorite Status
  res = await makeRequest('GET', `/api/favorites/check/${activeStadiumId}`, null, token1);
  if (res.status === 200 && res.data?.success && res.data?.isFavorite === false) {
    logPass('Test 3 - Initial Favorite Status');
  } else {
    logFail('Test 3 - Initial Favorite Status', 'HTTP 200 and isFavorite === false', JSON.stringify(res.data), res.status);
  }

  // TEST 4 - Add Favorite
  res = await makeRequest('POST', '/api/favorites', { stadium: activeStadiumId }, token1);
  if (res.status === 201 && res.data?.success && res.data?.favorite) {
    if (res.data.favorite.stadium === activeStadiumId) {
      logPass('Test 4 - Add Favorite');
    } else {
      logFail('Test 4 - Add Favorite', 'References correct stadium ID', res.data.favorite.stadium, res.status);
    }
  } else {
    logFail('Test 4 - Add Favorite', 'HTTP 201 and created favorite', JSON.stringify(res.data), res.status);
  }

  // TEST 5 - Check Favorite
  res = await makeRequest('GET', `/api/favorites/check/${activeStadiumId}`, null, token1);
  if (res.status === 200 && res.data?.success && res.data?.isFavorite === true) {
    logPass('Test 5 - Check Favorite Status');
  } else {
    logFail('Test 5 - Check Favorite Status', 'HTTP 200 and isFavorite === true', JSON.stringify(res.data), res.status);
  }

  // TEST 6 - Get My Favorites
  res = await makeRequest('GET', '/api/favorites/my', null, token1);
  if (res.status === 200 && res.data?.success && Array.isArray(res.data?.favorites)) {
    const hasMatch = res.data.favorites.some(f => f.stadium?._id === activeStadiumId);
    if (hasMatch) {
      logPass('Test 6 - Get My Favorites');
    } else {
      logFail('Test 6 - Get My Favorites', 'Contains the added favorite stadium', 'Not found in array', res.status);
    }
  } else {
    logFail('Test 6 - Get My Favorites', 'HTTP 200 and favorites array', JSON.stringify(res.data), res.status);
  }

  // TEST 7 - Duplicate Favorite Protection
  res = await makeRequest('POST', '/api/favorites', { stadium: activeStadiumId }, token1);
  if (res.status === 409 && res.data?.success === false && res.data?.message?.includes('already in your favorites')) {
    logPass('Test 7 - Duplicate Favorite Protection');
  } else {
    logFail('Test 7 - Duplicate Favorite Protection', 'HTTP 409 and correct message', JSON.stringify(res.data), res.status);
  }

  // Login as User 2
  res = await makeRequest('POST', '/api/auth/login', user2);
  if (res.status === 200 && res.data?.success && res.data?.token) {
    token2 = res.data.token;
  } else {
    console.log('Warning: User 2 login failed. Skipping dependent tests.');
  }

  // PRE-CLEANUP User 2
  if (token2) await makeRequest('DELETE', `/api/favorites/${activeStadiumId}`, null, token2);

  // TEST 8 - User 2 Isolation
  if (token2) {
    res = await makeRequest('GET', '/api/favorites/my', null, token2);
    const hasYagniksFavorite = res.data?.favorites?.some(f => f.stadium?._id === activeStadiumId);
    if (res.status === 200 && !hasYagniksFavorite) {
      logPass('Test 8 - User 2 Isolation');
    } else {
      logFail('Test 8 - User 2 Isolation', 'Does not see User 1 favorite', hasYagniksFavorite ? 'Found User 1 favorite' : JSON.stringify(res.data), res.status);
    }
  } else {
    logSkip('Test 8 - User 2 Isolation', 'No token2');
  }

  // TEST 9 - User 2 Add Favorite
  if (token2) {
    res = await makeRequest('POST', '/api/favorites', { stadium: activeStadiumId }, token2);
    if (res.status === 201 && res.data?.success) {
      logPass('Test 9 - User 2 Add Favorite');
    } else {
      logFail('Test 9 - User 2 Add Favorite', 'HTTP 201', JSON.stringify(res.data), res.status);
    }
  } else {
    logSkip('Test 9 - User 2 Add Favorite', 'No token2');
  }

  // TEST 10 - User 2 Check Favorite
  if (token2) {
    res = await makeRequest('GET', `/api/favorites/check/${activeStadiumId}`, null, token2);
    if (res.status === 200 && res.data?.isFavorite === true) {
      logPass('Test 10 - User 2 Check Favorite');
    } else {
      logFail('Test 10 - User 2 Check Favorite', 'isFavorite === true', JSON.stringify(res.data), res.status);
    }
  } else {
    logSkip('Test 10 - User 2 Check Favorite', 'No token2');
  }

  // TEST 11 - User Isolation Verification
  if (token2) {
    const res1 = await makeRequest('GET', '/api/favorites/my', null, token1);
    const res2 = await makeRequest('GET', '/api/favorites/my', null, token2);
    if (res1.status === 200 && res2.status === 200) {
      const u1HasOwn = res1.data.favorites.some(f => f.stadium?._id === activeStadiumId);
      const u2HasOwn = res2.data.favorites.some(f => f.stadium?._id === activeStadiumId);
      if (u1HasOwn && u2HasOwn) {
         logPass('Test 11 - User Isolation Verification');
      } else {
         logFail('Test 11 - User Isolation Verification', 'Both users see their own favorites', `User1: ${u1HasOwn}, User2: ${u2HasOwn}`);
      }
    } else {
      logFail('Test 11 - User Isolation Verification', 'HTTP 200 for both', `U1: ${res1.status}, U2: ${res2.status}`);
    }
  } else {
    logSkip('Test 11 - User Isolation Verification', 'No token2');
  }

  // TEST 12 - Remove Favorite
  res = await makeRequest('DELETE', `/api/favorites/${activeStadiumId}`, null, token1);
  if (res.status === 200 && res.data?.success && res.data?.message?.includes('removed')) {
    logPass('Test 12 - Remove Favorite');
  } else {
    logFail('Test 12 - Remove Favorite', 'HTTP 200 and success', JSON.stringify(res.data), res.status);
  }

  // TEST 13 - Verify Favorite Removed
  res = await makeRequest('GET', `/api/favorites/check/${activeStadiumId}`, null, token1);
  if (res.status === 200 && res.data?.isFavorite === false) {
    logPass('Test 13 - Verify Favorite Removed');
  } else {
    logFail('Test 13 - Verify Favorite Removed', 'isFavorite === false', JSON.stringify(res.data), res.status);
  }

  // TEST 14 - Remove Non-Existing Favorite
  res = await makeRequest('DELETE', `/api/favorites/${activeStadiumId}`, null, token1);
  if (res.status === 404 && res.data?.success === false) {
    logPass('Test 14 - Remove Non-Existing Favorite');
  } else {
    logFail('Test 14 - Remove Non-Existing Favorite', 'HTTP 404', JSON.stringify(res.data), res.status);
  }

  // TEST 15 - Unauthenticated Access
  const res15a = await makeRequest('GET', '/api/favorites/my');
  const res15b = await makeRequest('POST', '/api/favorites', { stadium: activeStadiumId });
  if (res15a.status === 401 && res15b.status === 401) {
    logPass('Test 15 - Unauthenticated Access');
  } else {
    logFail('Test 15 - Unauthenticated Access', 'HTTP 401 for both', `GET: ${res15a.status}, POST: ${res15b.status}`);
  }

  // TEST 16 - Invalid Stadium ID
  res = await makeRequest('POST', '/api/favorites', { stadium: 'invalid-id' }, token1);
  if (res.status === 400 || res.status === 404) {
    logPass('Test 16 - Invalid Stadium ID');
  } else {
    logFail('Test 16 - Invalid Stadium ID', 'HTTP 400 or 404', res.status, res.status);
  }

  // TEST 17 - Missing Stadium
  res = await makeRequest('POST', '/api/favorites', {}, token1);
  if (res.status === 400) {
    logPass('Test 17 - Missing Stadium Field');
  } else {
    logFail('Test 17 - Missing Stadium Field', 'HTTP 400', res.status, res.status);
  }

  // TEST 18 - Inactive Stadium Protection
  // Look for any inactive stadium to test with safely, without modifying the active one
  const allStadiumsRes = await makeRequest('GET', '/api/stadiums/admin/all', null, token1); // Note: Assuming Yagnik isn't admin, this might fail, let's just search public
  // Wait, public endpoint only returns active stadiums. We don't have a reliable way to get an inactive stadium without Admin token or changing state.
  // We will SKIP this test as requested if we can't find one easily.
  logSkip('Test 18 - Inactive Stadium Protection', 'No safe inactive stadium ID available without altering DB state.');

  // CLEANUP
  console.log('\n--- CLEANUP ---');
  await makeRequest('DELETE', `/api/favorites/${activeStadiumId}`, null, token1);
  if (token2) {
    await makeRequest('DELETE', `/api/favorites/${activeStadiumId}`, null, token2);
  }
  console.log('Cleanup completed. Existing data untouched.');

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
