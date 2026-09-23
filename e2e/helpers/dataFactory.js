/**
 * Test Data Factory for E2E Tests
 * All test data is strictly prefixed with E2E_ or e2e_ for safe isolation and cleanup.
 */

function generateE2EUser(suffix = '') {
  const timestamp = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const id = `${timestamp}_${rand}${suffix ? '_' + suffix : ''}`;
  return {
    name: `E2E_User_${id}`,
    email: `e2e_${id}@example.com`,
    password: `E2E_Password@${rand}`,
    phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
    mobile: `98765${Math.floor(10000 + Math.random() * 90000)}`,
  };
}

function generateE2EStadium(suffix = '') {
  const timestamp = Date.now();
  const rand = Math.floor(1000 + Math.random() * 9000);
  const id = `${timestamp}_${rand}${suffix ? '_' + suffix : ''}`;
  return {
    name: `E2E_Test_Stadium_${id}`,
    description: 'E2E automated testing stadium facility with all standard features',
    address: '123 E2E Test Arena Avenue',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    sports: ['Cricket', 'Football'],
    pricePerHour: 1200,
    capacity: 200,
    playerCapacity: 22,
    openingTime: '06:00',
    closingTime: '22:00',
    slotDuration: 60,
    facilities: ['Parking', 'Floodlights', 'Dressing Room', 'Restrooms'],
    rules: ['Wear proper footwear', 'Respect scheduled time limits'],
    isActive: true,
  };
}

/**
 * Returns a future date string in YYYY-MM-DD format (within maxAdvanceBookingDays).
 * Default is 3 days ahead.
 */
function getFutureDate(daysAhead = 3) {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  generateE2EUser,
  generateE2EStadium,
  getFutureDate,
};
