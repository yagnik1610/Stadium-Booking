const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';
const adminCredentials = {
  email: process.env.TEST_ADMIN_ID || process.env.ADMIN_LOGIN_ID || process.env.ADMIN_EMAIL,
  password: process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD
};

async function testStadiumPostalAndCurrency() {
  console.log('--- Testing Stadium Postal Code and Currency Persistence ---');
  
  // 1. Admin Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(adminCredentials)
  });
  const loginData = await loginRes.json();
  const token = loginData.token || loginData.data?.token;
  if (!token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginData));
  }
  console.log('✅ 1. Admin authenticated successfully');

  // 2. Create Stadium with postalCode & currency
  const newStadium = {
    name: 'Postal Currency Test Arena ' + Date.now(),
    description: 'Testing persistence of postalCode and currency fields',
    location: 'West Sports Corridor',
    address: '100 Stadium Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    postalCode: '380015',
    currency: 'INR',
    sports: ['Football', 'Cricket'],
    pricePerHour: 1200,
    openingTime: '06:00',
    closingTime: '22:00',
    capacity: 25,
    playerCapacity: 25,
    audienceCapacity: 400,
    audienceAllowed: true,
    minDuration: 1,
    maxDuration: 4
  };

  const createRes = await fetch(`${BASE_URL}/api/stadiums`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(newStadium)
  });
  const createData = await createRes.json();
  if (createRes.status !== 201 || !createData.stadium?._id) {
    throw new Error('Create stadium failed: ' + JSON.stringify(createData));
  }
  const stadiumId = createData.stadium._id;
  console.log('✅ 2. Stadium created with ID:', stadiumId);
  console.log('   Returned postalCode:', createData.stadium.postalCode);
  console.log('   Returned currency:', createData.stadium.currency);

  if (createData.stadium.postalCode !== '380015' || createData.stadium.currency !== 'INR') {
    throw new Error(`PostalCode/Currency mismatch on create! Got postalCode=${createData.stadium.postalCode}, currency=${createData.stadium.currency}`);
  }

  // 3. Direct MongoDB inspection via Stadium model
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking';
  await mongoose.connect(mongoUri);
  const Stadium = require('../models/Stadium');
  const dbRecord = await Stadium.findById(stadiumId);
  console.log('✅ 3. Direct MongoDB document verification:');
  console.log('   MongoDB postalCode:', dbRecord.postalCode);
  console.log('   MongoDB currency:', dbRecord.currency);
  if (dbRecord.postalCode !== '380015' || dbRecord.currency !== 'INR') {
    throw new Error('MongoDB document did not persist postalCode or currency!');
  }

  // 4. Update Stadium with new postalCode and currency
  const updateRes = await fetch(`${BASE_URL}/api/stadiums/${stadiumId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      postalCode: '380054',
      currency: 'INR'
    })
  });
  const updateData = await updateRes.json();
  if (updateRes.status !== 200) {
    throw new Error('Update stadium failed: ' + JSON.stringify(updateData));
  }
  console.log('✅ 4. Stadium updated successfully:');
  console.log('   Updated postalCode:', updateData.stadium.postalCode);
  console.log('   Updated currency:', updateData.stadium.currency);

  if (updateData.stadium.postalCode !== '380054' || updateData.stadium.currency !== 'INR') {
    throw new Error('Update response did not reflect updated postalCode or currency');
  }

  // 5. Retrieve via Public GET /api/stadiums/:id
  const getRes = await fetch(`${BASE_URL}/api/stadiums/${stadiumId}`);
  const getData = await getRes.json();
  console.log('✅ 5. Public GET /api/stadiums/:id:');
  console.log('   Retrieved postalCode:', getData.stadium.postalCode);
  console.log('   Retrieved currency:', getData.stadium.currency);
  if (getData.stadium.postalCode !== '380054') {
    throw new Error('Public GET did not return updated postalCode!');
  }

  // 6. Cleanup
  await Stadium.findByIdAndDelete(stadiumId);
  await mongoose.disconnect();
  console.log('✅ 6. Cleaned up test stadium from database');
  console.log('\n>>> ALL POSTAL CODE & CURRENCY PERSISTENCE CHECKS PASSED <<<\n');
}

testStadiumPostalAndCurrency().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
