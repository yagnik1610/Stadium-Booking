const fs = require('fs');
require('dotenv').config();

const BASE_URL = 'http://localhost:5000';
const adminUser = {
  email: process.env.TEST_ADMIN_ID || process.env.ADMIN_EMAIL || 'admin@stadium.com',
  password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'admin12345'
};
let adminToken = null;
let testStadiumId = null;
let inactiveStadiumId = null;

let totalTests = 40;
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
  console.log('MODULE 13 STADIUM SEARCH TEST SUITE');
  console.log('========================================\n');

  // Setup: Get Admin Token
  let res = await makeRequest('POST', '/api/auth/login', adminUser);
  if (res.status === 200) {
    adminToken = res.data.token;
  } else {
    console.log('Failed to login admin, some setup might fail.');
  }

  // Setup: Create a specific stadium to ensure our search tests have predictable data
  if (adminToken) {
    res = await makeRequest('POST', '/api/stadiums', {
      name: 'Advanced Search Arena',
      description: 'A beautiful stadium for testing advanced search filters.',
      location: 'Test Location',
      address: '123 Search St',
      city: 'AhmedabadTest',
      sports: ['FootballTest', 'CricketTest'],
      capacity: 50000,
      pricePerHour: 2000,
      facilities: ['ParkingTest', 'Changing RoomsTest'],
      openingTime: '06:00',
      closingTime: '22:00',
      isActive: true
    }, adminToken);
    
    if (res.status === 201) {
      testStadiumId = res.data.stadium._id;
    }

    // Create an inactive stadium
    res = await makeRequest('POST', '/api/stadiums', {
      name: 'Inactive Search Arena',
      description: 'This should not appear in search.',
      location: 'Test Location',
      address: '123 Search St',
      city: 'AhmedabadTest',
      sports: ['FootballTest'],
      capacity: 10000,
      pricePerHour: 1000,
      facilities: ['ParkingTest'],
      openingTime: '06:00',
      closingTime: '22:00',
      isActive: false
    }, adminToken);

    if (res.status === 201) {
      inactiveStadiumId = res.data.stadium._id;
    }
  }

  // TEST 1 — Public basic search endpoint
  res = await makeRequest('GET', '/api/stadiums/search');
  if (res.status === 200 && res.data?.success) logPass('Test 1 - Public basic search endpoint');
  else logFail('Test 1 - Public basic search endpoint', 'HTTP 200', res.status);

  // TEST 2 — Search by text query
  res = await makeRequest('GET', '/api/stadiums/search?q=Advanced%20Search%20Arena');
  if (res.status === 200 && res.data?.stadiums?.some(s => s.name === 'Advanced Search Arena')) {
    logPass('Test 2 - Search by text query');
  } else {
    logFail('Test 2 - Search by text query', 'Stadium found', res.data?.stadiums?.length);
  }

  // TEST 3 — Search by city
  res = await makeRequest('GET', '/api/stadiums/search?city=AhmedabadTest');
  if (res.status === 200 && res.data?.stadiums?.some(s => s.city === 'AhmedabadTest')) {
    logPass('Test 3 - Search by city');
  } else {
    logFail('Test 3 - Search by city', 'Stadium found by city', res.data?.stadiums?.length);
  }

  // TEST 4 — City filter must be case-insensitive
  res = await makeRequest('GET', '/api/stadiums/search?city=ahmedabadtest');
  if (res.status === 200 && res.data?.stadiums?.some(s => s.city === 'AhmedabadTest')) {
    logPass('Test 4 - City filter must be case-insensitive');
  } else {
    logFail('Test 4 - City filter must be case-insensitive', 'Stadium found by lowercase city', res.data?.stadiums?.length);
  }

  // TEST 5 — Sport filter
  res = await makeRequest('GET', '/api/stadiums/search?sport=FootballTest');
  if (res.status === 200 && res.data?.stadiums?.some(s => s.sports.includes('FootballTest'))) {
    logPass('Test 5 - Sport filter');
  } else {
    logFail('Test 5 - Sport filter', 'Stadium found by sport', res.data?.stadiums?.length);
  }

  // TEST 6 — Sport filter must be case-insensitive
  res = await makeRequest('GET', '/api/stadiums/search?sport=footballtest');
  if (res.status === 200 && res.data?.stadiums?.some(s => s.sports.includes('FootballTest'))) {
    logPass('Test 6 - Sport filter must be case-insensitive');
  } else {
    logFail('Test 6 - Sport filter must be case-insensitive', 'Stadium found by lowercase sport', res.data?.stadiums?.length);
  }

  // TEST 7 — Minimum price
  res = await makeRequest('GET', '/api/stadiums/search?minPrice=2000');
  if (res.status === 200 && res.data?.stadiums?.every(s => s.pricePerHour >= 2000)) {
    logPass('Test 7 - Minimum price');
  } else {
    logFail('Test 7 - Minimum price', 'All >= 2000', 'Contains < 2000');
  }

  // TEST 8 — Maximum price
  res = await makeRequest('GET', '/api/stadiums/search?maxPrice=2000');
  if (res.status === 200 && res.data?.stadiums?.every(s => s.pricePerHour <= 2000)) {
    logPass('Test 8 - Maximum price');
  } else {
    logFail('Test 8 - Maximum price', 'All <= 2000', 'Contains > 2000');
  }

  // TEST 9 — Price range
  res = await makeRequest('GET', '/api/stadiums/search?minPrice=1500&maxPrice=2500');
  if (res.status === 200 && res.data?.stadiums?.every(s => s.pricePerHour >= 1500 && s.pricePerHour <= 2500)) {
    logPass('Test 9 - Price range');
  } else {
    logFail('Test 9 - Price range', 'All between 1500 and 2500', 'Outside range');
  }

  // TEST 10 — Minimum capacity
  res = await makeRequest('GET', '/api/stadiums/search?minCapacity=50000');
  if (res.status === 200 && res.data?.stadiums?.every(s => s.capacity >= 50000)) {
    logPass('Test 10 - Minimum capacity');
  } else {
    logFail('Test 10 - Minimum capacity', 'All >= 50000', 'Contains < 50000');
  }

  // TEST 11 — Maximum capacity
  res = await makeRequest('GET', '/api/stadiums/search?maxCapacity=50000');
  if (res.status === 200 && res.data?.stadiums?.every(s => s.capacity <= 50000)) {
    logPass('Test 11 - Maximum capacity');
  } else {
    logFail('Test 11 - Maximum capacity', 'All <= 50000', 'Contains > 50000');
  }

  // TEST 12 — Facility filter
  res = await makeRequest('GET', '/api/stadiums/search?facility=ParkingTest');
  if (res.status === 200 && res.data?.stadiums?.some(s => s.facilities.includes('ParkingTest'))) {
    logPass('Test 12 - Facility filter');
  } else {
    logFail('Test 12 - Facility filter', 'Contains ParkingTest', res.data?.stadiums?.length);
  }

  // TEST 13 — Multiple filters
  res = await makeRequest('GET', '/api/stadiums/search?city=AhmedabadTest&sport=FootballTest&minPrice=1000');
  if (res.status === 200 && res.data?.stadiums?.some(s => s.name === 'Advanced Search Arena')) {
    logPass('Test 13 - Multiple filters');
  } else {
    logFail('Test 13 - Multiple filters', 'Found matching stadium', res.data?.stadiums?.length);
  }

  // TEST 14 — Price ascending sorting
  res = await makeRequest('GET', '/api/stadiums/search?sort=price_asc');
  if (res.status === 200 && res.data?.stadiums) {
    let sorted = true;
    for(let i=0; i < res.data.stadiums.length - 1; i++) {
      if(res.data.stadiums[i].pricePerHour > res.data.stadiums[i+1].pricePerHour) sorted = false;
    }
    if (sorted) logPass('Test 14 - Price ascending sorting');
    else logFail('Test 14 - Price ascending sorting', 'Sorted ascending', 'Not sorted');
  } else logFail('Test 14 - Price ascending sorting', 'HTTP 200', res.status);

  // TEST 15 — Price descending sorting
  res = await makeRequest('GET', '/api/stadiums/search?sort=price_desc');
  if (res.status === 200 && res.data?.stadiums) {
    let sorted = true;
    for(let i=0; i < res.data.stadiums.length - 1; i++) {
      if(res.data.stadiums[i].pricePerHour < res.data.stadiums[i+1].pricePerHour) sorted = false;
    }
    if (sorted) logPass('Test 15 - Price descending sorting');
    else logFail('Test 15 - Price descending sorting', 'Sorted descending', 'Not sorted');
  } else logFail('Test 15 - Price descending sorting', 'HTTP 200', res.status);

  // TEST 16 — Name ascending sorting
  res = await makeRequest('GET', '/api/stadiums/search?sort=name_asc');
  if (res.status === 200 && res.data?.stadiums) {
    let sorted = true;
    for(let i=0; i < res.data.stadiums.length - 1; i++) {
      if(res.data.stadiums[i].name.localeCompare(res.data.stadiums[i+1].name) > 0) sorted = false;
    }
    if (sorted) logPass('Test 16 - Name ascending sorting');
    else logFail('Test 16 - Name ascending sorting', 'Sorted ascending', 'Not sorted');
  } else logFail('Test 16 - Name ascending sorting', 'HTTP 200', res.status);

  // TEST 17 — Capacity descending sorting
  res = await makeRequest('GET', '/api/stadiums/search?sort=capacity_desc');
  if (res.status === 200 && res.data?.stadiums) {
    let sorted = true;
    for(let i=0; i < res.data.stadiums.length - 1; i++) {
      if(res.data.stadiums[i].capacity < res.data.stadiums[i+1].capacity) sorted = false;
    }
    if (sorted) logPass('Test 17 - Capacity descending sorting');
    else logFail('Test 17 - Capacity descending sorting', 'Sorted descending', 'Not sorted');
  } else logFail('Test 17 - Capacity descending sorting', 'HTTP 200', res.status);

  // TEST 18 — Pagination
  res = await makeRequest('GET', '/api/stadiums/search?page=1&limit=2');
  if (res.status === 200 && res.data?.pagination?.page === 1 && res.data?.stadiums?.length <= 2) {
    logPass('Test 18 - Pagination');
  } else {
    logFail('Test 18 - Pagination', 'Page 1, limit 2', res.status);
  }

  // TEST 19 — Second pagination page
  const page1 = await makeRequest('GET', '/api/stadiums/search?page=1&limit=1');
  const page2 = await makeRequest('GET', '/api/stadiums/search?page=2&limit=1');
  if (page1.data?.total > 1) {
    if (page1.data.stadiums[0]._id !== page2.data.stadiums[0]._id) {
      logPass('Test 19 - Second pagination page');
    } else {
      logFail('Test 19 - Second pagination page', 'Different stadiums', 'Same stadium');
    }
  } else {
    logSkip('Test 19 - Second pagination page', 'Not enough stadiums in DB');
  }

  // TEST 20 — Limit maximum validation
  res = await makeRequest('GET', '/api/stadiums/search?limit=1000');
  if (res.status === 400) logPass('Test 20 - Limit maximum validation');
  else logFail('Test 20 - Limit maximum validation', 'HTTP 400', res.status);

  // TEST 21 — Invalid page
  res = await makeRequest('GET', '/api/stadiums/search?page=0');
  if (res.status === 400) logPass('Test 21 - Invalid page');
  else logFail('Test 21 - Invalid page', 'HTTP 400', res.status);

  // TEST 22 — Invalid limit
  res = await makeRequest('GET', '/api/stadiums/search?limit=-1');
  if (res.status === 400) logPass('Test 22 - Invalid limit');
  else logFail('Test 22 - Invalid limit', 'HTTP 400', res.status);

  // TEST 23 — Invalid price
  res = await makeRequest('GET', '/api/stadiums/search?minPrice=abc');
  if (res.status === 400) logPass('Test 23 - Invalid price');
  else logFail('Test 23 - Invalid price', 'HTTP 400', res.status);

  // TEST 24 — Negative price
  res = await makeRequest('GET', '/api/stadiums/search?minPrice=-100');
  if (res.status === 400) logPass('Test 24 - Negative price');
  else logFail('Test 24 - Negative price', 'HTTP 400', res.status);

  // TEST 25 — minPrice greater than maxPrice
  res = await makeRequest('GET', '/api/stadiums/search?minPrice=5000&maxPrice=1000');
  if (res.status === 400) logPass('Test 25 - minPrice greater than maxPrice');
  else logFail('Test 25 - minPrice greater than maxPrice', 'HTTP 400', res.status);

  // TEST 26 — minCapacity greater than maxCapacity
  res = await makeRequest('GET', '/api/stadiums/search?minCapacity=50000&maxCapacity=10000');
  if (res.status === 400) logPass('Test 26 - minCapacity greater than maxCapacity');
  else logFail('Test 26 - minCapacity greater than maxCapacity', 'HTTP 400', res.status);

  // TEST 27 — Invalid sort value
  res = await makeRequest('GET', '/api/stadiums/search?sort=invalid_sort');
  if (res.status === 400) logPass('Test 27 - Invalid sort value');
  else logFail('Test 27 - Invalid sort value', 'HTTP 400', res.status);

  // TEST 28 — Empty search results
  res = await makeRequest('GET', '/api/stadiums/search?city=NoSuchCityExistsEver');
  if (res.status === 200 && res.data?.count === 0) logPass('Test 28 - Empty search results');
  else logFail('Test 28 - Empty search results', 'HTTP 200, count 0', res.status);

  // TEST 29 — Inactive stadium protection
  if (inactiveStadiumId) {
    res = await makeRequest('GET', `/api/stadiums/search?q=Inactive%20Search%20Arena`);
    if (res.status === 200 && res.data?.count === 0) {
      logPass('Test 29 - Inactive stadium protection');
    } else {
      logFail('Test 29 - Inactive stadium protection', 'HTTP 200, count 0', res.data?.count);
    }
  } else {
    logSkip('Test 29 - Inactive stadium protection', 'No inactive stadium found');
  }

  // TEST 30 — Client cannot bypass inactive filtering
  if (inactiveStadiumId) {
    res = await makeRequest('GET', `/api/stadiums/search?isActive=false`);
    if (res.status === 200 && !res.data?.stadiums?.some(s => s.name === 'Inactive Search Arena')) {
      logPass('Test 30 - Client cannot bypass inactive filtering');
    } else {
      logFail('Test 30 - Client cannot bypass inactive filtering', 'Inactive stadium not found', 'Found inactive');
    }
  } else {
    logSkip('Test 30 - Client cannot bypass inactive filtering', 'No inactive stadium found');
  }

  // TEST 31 — Unauthenticated public search works
  res = await makeRequest('GET', '/api/stadiums/search');
  if (res.status === 200) logPass('Test 31 - Unauthenticated public search works');
  else logFail('Test 31 - Unauthenticated public search works', 'HTTP 200', res.status);

  // TEST 32 — Existing stadium detail endpoint still works
  if (testStadiumId) {
    res = await makeRequest('GET', `/api/stadiums/${testStadiumId}`);
    if (res.status === 200) logPass('Test 32 - Existing stadium detail endpoint still works');
    else logFail('Test 32 - Existing stadium detail endpoint still works', 'HTTP 200', res.status);
  } else {
    logSkip('Test 32 - Existing stadium detail endpoint still works', 'No test stadium ID');
  }

  // TEST 33 — Existing admin stadium endpoint still works
  res = await makeRequest('GET', '/api/stadiums/admin/all', null, adminToken);
  if (res.status === 200) logPass('Test 33 - Existing admin stadium endpoint still works');
  else logFail('Test 33 - Existing admin stadium endpoint still works', 'HTTP 200', res.status);

  // Get a user token for subsequent regression tests
  let regularToken = null;
  res = await makeRequest('POST', '/api/auth/login', { email: 'yagnik@test.com', password: 'password123' });
  if (res.status === 200) {
    regularToken = res.data.token;
  }

  // TEST 34 — Existing booking endpoint regression
  res = await makeRequest('GET', '/api/bookings/my', null, regularToken);
  if (res.status === 200) logPass('Test 34 - Existing booking endpoint regression');
  else logFail('Test 34 - Existing booking endpoint regression', 'HTTP 200', res.status);

  // TEST 35 — Existing availability endpoint regression
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const dateStr = futureDate.toISOString().split('T')[0];
  res = await makeRequest('GET', `/api/stadiums/${testStadiumId}/availability?date=${dateStr}`);
  if (res.status === 200) logPass('Test 35 - Existing availability endpoint regression');
  else logFail('Test 35 - Existing availability endpoint regression', 'HTTP 200', res.status);

  // TEST 36 — Existing favorite endpoint regression
  res = await makeRequest('GET', '/api/favorites/my', null, regularToken);
  if (res.status === 200) logPass('Test 36 - Existing favorite endpoint regression');
  else logFail('Test 36 - Existing favorite endpoint regression', 'HTTP 200', res.status);

  // TEST 37 — Existing review endpoint regression
  res = await makeRequest('GET', '/api/reviews/my', null, regularToken);
  if (res.status === 200) logPass('Test 37 - Existing review endpoint regression');
  else logFail('Test 37 - Existing review endpoint regression', 'HTTP 200', res.status);

  // TEST 38 — Existing notification endpoint regression
  res = await makeRequest('GET', '/api/notifications/my', null, regularToken);
  if (res.status === 200) logPass('Test 38 - Existing notification endpoint regression');
  else logFail('Test 38 - Existing notification endpoint regression', 'HTTP 200', res.status);

  // TEST 39 — Existing payment endpoint regression
  res = await makeRequest('GET', '/api/payments/my', null, regularToken);
  if (res.status === 200) logPass('Test 39 - Existing payment endpoint regression');
  else logFail('Test 39 - Existing payment endpoint regression', 'HTTP 200', res.status);

  // TEST 40 — Server stability after all tests
  res = await makeRequest('GET', '/api/health');
  if (res.status === 200) logPass('Test 40 - Server stability after all tests');
  else logFail('Test 40 - Server stability after all tests', 'HTTP 200', res.status);

  // CLEANUP
  console.log('\n--- CLEANUP ---');
  if (adminToken) {
    if (testStadiumId) {
       // We can actually hard delete them to clean up or soft delete them
       // Wait, there's no hard delete endpoint. I'll soft delete the active one.
       await makeRequest('DELETE', `/api/stadiums/${testStadiumId}`, null, adminToken);
       console.log('Soft deleted test active stadium.');
    }
  }

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
