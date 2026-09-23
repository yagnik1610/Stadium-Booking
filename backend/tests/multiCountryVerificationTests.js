const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';
const User = require('../models/User');
const Stadium = require('../models/Stadium');
const Favorite = require('../models/Favorite');

const runVerification = async () => {
  console.log('====================================================');
  console.log('MULTI-COUNTRY, STADIUM & DATA VERIFICATION SUITE');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB directly for database assertion.');

  let passed = 0;
  let failed = 0;

  const test = (name, condition, details = '') => {
    if (condition) {
      console.log(`[PASS] ${name} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  };

  try {
    // ----------------------------------------------------
    // TEST 1: International Registration (+44 UK User)
    // ----------------------------------------------------
    const uniqueUK = `uk_fan_${Date.now()}@example.com`;
    const ukRegRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Oliver Queen',
      email: uniqueUK,
      password: 'Password@123',
      mobile: '+44 7123456789',
      age: 28,
      gender: 'Male',
      country: 'United Kingdom',
      state: 'England',
      city: 'London'
    });

    test('UK user registration with +44 phone', ukRegRes.status === 201 && ukRegRes.data.success);
    const ukToken = ukRegRes.data.token;

    // Verify in MongoDB directly
    const dbUkUser = await User.findOne({ email: uniqueUK }).select('+password');
    test('MongoDB contains UK user record', Boolean(dbUkUser));
    test('MongoDB stored country: United Kingdom', dbUkUser.country === 'United Kingdom');
    test('MongoDB stored international mobile: +44 7123456789', dbUkUser.mobile === '+44 7123456789');
    test('MongoDB password is encrypted/hashed (not plaintext)', dbUkUser.password !== 'Password@123' && dbUkUser.password.length > 30);
    test('MongoDB stored state & city', dbUkUser.state === 'England' && dbUkUser.city === 'London');

    // ----------------------------------------------------
    // TEST 2: International Registration (+1 US User)
    // ----------------------------------------------------
    const uniqueUS = `us_fan_${Date.now()}@example.com`;
    const usRegRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Sarah Connor',
      email: uniqueUS,
      password: 'Password@123',
      mobile: '+1 4155551234',
      age: 32,
      gender: 'Female',
      country: 'United States',
      state: 'California',
      city: 'Los Angeles'
    });
    test('US user registration with +1 phone', usRegRes.status === 201 && usRegRes.data.success);

    // ----------------------------------------------------
    // TEST 3: Invalid phone number rejection
    // ----------------------------------------------------
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        name: 'Invalid Phone User',
        email: `invalid_phone_${Date.now()}@example.com`,
        password: 'Password@123',
        mobile: '123', // Too short
        country: 'India'
      });
      test('Short phone rejection', false, 'Should have thrown error');
    } catch (err) {
      test('Short phone rejection (< 7 digits)', err.response?.status === 400);
    }

    // ----------------------------------------------------
    // TEST 4: Stadium Dataset in MongoDB
    // ----------------------------------------------------
    const allActiveStadiums = await Stadium.find({ isActive: true });
    test('Active stadiums in MongoDB', allActiveStadiums.length >= 35, `Found: ${allActiveStadiums.length}`);

    const indianStadiums = allActiveStadiums.filter(s => s.country === 'India');
    test('Indian stadium catalog count', indianStadiums.length >= 25, `Found: ${indianStadiums.length}`);

    const intlStadiums = allActiveStadiums.filter(s => s.country !== 'India');
    test('International stadium catalog count', intlStadiums.length >= 5, `Found: ${intlStadiums.length}`);

    // Verify supported countries
    const countriesInDb = Array.from(new Set(allActiveStadiums.map(s => s.country)));
    test('Supported countries catalog', 
      countriesInDb.includes('India') && 
      countriesInDb.includes('United Kingdom') && 
      countriesInDb.includes('Spain') && 
      countriesInDb.includes('United States') && 
      countriesInDb.includes('Australia'),
      `Countries: ${countriesInDb.join(', ')}`
    );

    // ----------------------------------------------------
    // TEST 5: Public Search API Multi-Country Filter
    // ----------------------------------------------------
    const ukSearchRes = await axios.get(`${API_BASE}/stadiums/search?country=United Kingdom`);
    test('GET /api/stadiums/search?country=United Kingdom', 
      ukSearchRes.data.success && ukSearchRes.data.stadiums.every(s => s.country === 'United Kingdom'),
      `Found ${ukSearchRes.data.stadiums.length} venues`
    );

    const indiaCricketRes = await axios.get(`${API_BASE}/stadiums/search?country=India&sport=Cricket`);
    test('GET /api/stadiums/search?country=India&sport=Cricket',
      indiaCricketRes.data.success && indiaCricketRes.data.stadiums.every(s => s.country === 'India' && s.sports.includes('Cricket')),
      `Found ${indiaCricketRes.data.stadiums.length} venues`
    );

    const ahmedabadRes = await axios.get(`${API_BASE}/stadiums/search?country=India&state=Gujarat&city=Ahmedabad&sport=Cricket`);
    test('GET /api/stadiums/search?country=India&state=Gujarat&city=Ahmedabad&sport=Cricket',
      ahmedabadRes.data.success && ahmedabadRes.data.stadiums.every(s => s.city === 'Ahmedabad' && s.sports.includes('Cricket')),
      `Found ${ahmedabadRes.data.stadiums.length} venues`
    );

    // ----------------------------------------------------
    // TEST 6: Images are Valid & Present
    // ----------------------------------------------------
    const allHaveImages = allActiveStadiums.every(s => 
      (s.image && s.image.startsWith('http')) || 
      (s.images && s.images.length > 0 && s.images[0].startsWith('http'))
    );
    test('All stadiums have valid HTTP/HTTPS high-res image URLs', allHaveImages);

    // ----------------------------------------------------
    // TEST 7: Favorites Persistence in MongoDB
    // ----------------------------------------------------
    const wembley = allActiveStadiums.find(s => s.name === 'Wembley Stadium');
    test('Found Wembley Stadium for favorites test', Boolean(wembley));

    // Add favorite via API
    const addFavRes = await axios.post(
      `${API_BASE}/favorites`,
      { stadium: wembley._id },
      { headers: { Authorization: `Bearer ${ukToken}` } }
    );
    test('Add favorite via POST /api/favorites', addFavRes.data.success);

    // Check favorite in DB directly
    const dbFav = await Favorite.findOne({ user: dbUkUser._id, stadium: wembley._id });
    test('Favorite record persisted in MongoDB', Boolean(dbFav));

    // Check favorite status via API
    const checkFavRes = await axios.get(
      `${API_BASE}/favorites/check/${wembley._id}`,
      { headers: { Authorization: `Bearer ${ukToken}` } }
    );
    test('GET /api/favorites/check/:id returns isFavorite: true', checkFavRes.data.isFavorite === true);

    // List favorites
    const listFavRes = await axios.get(
      `${API_BASE}/favorites/my`,
      { headers: { Authorization: `Bearer ${ukToken}` } }
    );
    test('GET /api/favorites/my contains Wembley', 
      listFavRes.data.success && listFavRes.data.favorites.some(f => 
        (f.stadium?._id || f.stadium).toString() === wembley._id.toString()
      )
    );

    // Remove favorite
    const removeFavRes = await axios.delete(
      `${API_BASE}/favorites/${wembley._id}`,
      { headers: { Authorization: `Bearer ${ukToken}` } }
    );
    test('DELETE /api/favorites/:id removes favorite', removeFavRes.data.success);

    const dbFavAfter = await Favorite.findOne({ user: dbUkUser._id, stadium: wembley._id });
    test('Favorite removed from MongoDB', dbFavAfter === null);

    // ----------------------------------------------------
    // TEST 8: Contact Message API & DB Persistence
    // ----------------------------------------------------
    const contactRes = await axios.post(`${API_BASE}/contact`, {
      name: 'Global Player',
      email: 'player@fifa.org',
      subject: 'International Tournament Inquiry',
      message: 'Looking to book multiple arenas across UK and Spain for our tournament.'
    });
    test('POST /api/contact saves inquiry', contactRes.data.success);

    console.log('\n====================================================');
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution exception:', error.response?.data || error.message);
    process.exit(1);
  }
};

runVerification();
