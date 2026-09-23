const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';
const User = require('../models/User');

const runTest = async () => {
  console.log('====================================================');
  console.log('TESTING REGISTRATION LIFECYCLE, REDIRECT & ERRORS');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  let passed = 0;
  let failed = 0;

  const assert = (title, condition, info = '') => {
    if (condition) {
      console.log(`[PASS] ${title} ${info ? '(' + info + ')' : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} ${info ? '(' + info + ')' : ''}`);
      failed++;
    }
  };

  try {
    // -----------------------------------------------------------------
    // 1. Full-Stack Registration Flow (Oliver Vance from Manchester, UK)
    // -----------------------------------------------------------------
    const testEmail = `player_${Date.now()}@sportsturf.co.uk`;
    const regPayload = {
      name: 'Oliver Vance',
      email: testEmail,
      password: 'SecurePassword@123',
      mobile: '+44 7987654321',
      age: 26,
      gender: 'Male',
      country: 'United Kingdom',
      state: 'England',
      city: 'Manchester'
    };

    const regRes = await axios.post(`${API_BASE}/auth/register`, regPayload);
    assert('POST /api/auth/register returns 201 Created', regRes.status === 201);
    assert('Registration response success is true', regRes.data.success === true);
    assert('Registration response contains user payload', Boolean(regRes.data.user));
    assert('Registration response does NOT expose password', !regRes.data.user.password && !regRes.data.user.passwordHash);

    // 2. Direct MongoDB Inspection
    const dbUser = await User.findOne({ email: testEmail }).select('+password');
    assert('User exists in MongoDB', Boolean(dbUser));
    assert('MongoDB stored correct name', dbUser.name === 'Oliver Vance');
    assert('MongoDB stored country: United Kingdom', dbUser.country === 'United Kingdom');
    assert('MongoDB stored state: England', dbUser.state === 'England');
    assert('MongoDB stored city: Manchester', dbUser.city === 'Manchester');
    assert('MongoDB stored international mobile: +44 7987654321', dbUser.mobile === '+44 7987654321');
    assert('Password is encrypted / hashed with bcrypt (never plaintext)', dbUser.password !== 'SecurePassword@123' && dbUser.password.startsWith('$2'));

    // 3. Login using newly registered credentials (simulating /login flow)
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: 'SecurePassword@123'
    });
    assert('POST /api/auth/login returns 200 OK with new credentials', loginRes.status === 200 && loginRes.data.success === true);
    assert('Login returns valid JWT token', typeof loginRes.data.token === 'string' && loginRes.data.token.length > 20);
    const jwtToken = loginRes.data.token;

    // 4. Authenticated Request using the new token
    const profileRes = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${jwtToken}` }
    });
    assert('GET /api/auth/profile succeeds with newly issued JWT', profileRes.status === 200 && profileRes.data.success === true);
    assert('Profile returns stored country', profileRes.data.user.country === 'United Kingdom');
    assert('Profile returns stored mobile', profileRes.data.user.mobile === '+44 7987654321');
    assert('Profile never exposes password', !profileRes.data.user.password);

    // -----------------------------------------------------------------
    // 5. Error Flow: Duplicate Email Registration
    // -----------------------------------------------------------------
    try {
      await axios.post(`${API_BASE}/auth/register`, regPayload);
      assert('Duplicate email registration rejected', false, 'Should have failed with 400');
    } catch (err) {
      assert('Duplicate email returns 400 Bad Request', err.response?.status === 400);
      assert('Duplicate email returns clear error message', err.response?.data?.message?.includes('already exists'));
    }

    // -----------------------------------------------------------------
    // 6. Error Flow: Invalid International Phone Format
    // -----------------------------------------------------------------
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        name: 'Invalid Phone Tester',
        email: `invalid_phone_${Date.now()}@test.com`,
        password: 'Password@123',
        mobile: '1234' // Only 4 digits
      });
      assert('Invalid short phone rejected', false, 'Should have failed with 400');
    } catch (err) {
      assert('Short phone number (< 7 digits) rejected with 400', err.response?.status === 400);
      assert('Phone validation error message returned', err.response?.data?.message?.includes('international phone'));
    }

    // -----------------------------------------------------------------
    // 7. Error Flow: Missing Required Fields
    // -----------------------------------------------------------------
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        name: '',
        email: '',
        password: ''
      });
      assert('Empty required fields rejected', false, 'Should have failed with 400');
    } catch (err) {
      assert('Empty required fields return 400 Bad Request', err.response?.status === 400);
    }

    // -----------------------------------------------------------------
    // 8. Error Flow: Invalid Age Range (< 5 or > 120)
    // -----------------------------------------------------------------
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        name: 'Age Tester',
        email: `age_tester_${Date.now()}@test.com`,
        password: 'Password@123',
        age: 200 // Exceeds 120
      });
      assert('Invalid age rejected', false, 'Should have failed with 400');
    } catch (err) {
      assert('Age > 120 rejected with 400 Bad Request', err.response?.status === 400);
      assert('Age validation error message returned', err.response?.data?.message?.includes('Age must be'));
    }

    // -----------------------------------------------------------------
    // 9. Error Flow: Short Password (< 6 characters)
    // -----------------------------------------------------------------
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        name: 'Short Pass Tester',
        email: `short_pass_${Date.now()}@test.com`,
        password: '123'
      });
      assert('Password < 6 characters rejected', false, 'Should have failed with 400');
    } catch (err) {
      assert('Password < 6 characters rejected with 400 Bad Request', err.response?.status === 400);
      assert('Password length message returned', err.response?.data?.message?.includes('at least 6 characters'));
    }

    console.log('\n====================================================');
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error.response?.data || error.message);
    process.exit(1);
  }
};

runTest();
