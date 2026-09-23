const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

/**
 * Inspection Utility: Verifies all critical production database indexes
 */
const verifyIndexes = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking';
    console.log('\n========================================================');
    console.log('CRITICAL DATABASE INDEX VERIFICATION UTILITY');
    console.log('========================================================\n');
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.\n');

    const db = mongoose.connection.db;

    const criticalChecks = [
      {
        collection: 'slotlocks',
        name: 'SlotLock unique occupancy index',
        verify: (indexes) => {
          return indexes.some(idx => 
            idx.unique === true &&
            idx.key &&
            idx.key.stadium === 1 &&
            idx.key.bookingDate === 1 &&
            idx.key.timeSlot === 1
          );
        }
      },
      {
        collection: 'bookings',
        name: 'Booking overlap query index',
        verify: (indexes) => {
          return indexes.some(idx => 
            idx.key &&
            idx.key.stadium === 1 &&
            idx.key.bookingDate === 1 &&
            idx.key.startTime === 1 &&
            idx.key.endTime === 1
          );
        }
      },
      {
        collection: 'favorites',
        name: 'Favorite user-stadium unique index',
        verify: (indexes) => {
          return indexes.some(idx => 
            idx.unique === true &&
            idx.key &&
            idx.key.user === 1 &&
            idx.key.stadium === 1
          );
        }
      },
      {
        collection: 'users',
        name: 'User email unique index',
        verify: (indexes) => {
          return indexes.some(idx => 
            idx.unique === true &&
            idx.key &&
            idx.key.email === 1
          );
        }
      }
    ];

    let allPassed = true;

    for (const check of criticalChecks) {
      try {
        const indexes = await db.collection(check.collection).indexes();
        const passed = check.verify(indexes);
        if (passed) {
          console.log(`\x1b[32m✓ [PASS]\x1b[0m ${check.collection} -> ${check.name}`);
        } else {
          console.error(`\x1b[31m✗ [FAIL]\x1b[0m ${check.collection} -> ${check.name} MISSING OR NOT CONFIGURED CORRECTLY`);
          allPassed = false;
        }
      } catch (err) {
        console.error(`\x1b[31m✗ [ERROR]\x1b[0m ${check.collection} -> ${err.message}`);
        allPassed = false;
      }
    }

    console.log('\n========================================================');
    if (allPassed) {
      console.log('🎉 ALL CRITICAL PRODUCTION DATABASE INDEXES VERIFIED!');
      console.log('========================================================\n');
      await mongoose.disconnect();
      process.exit(0);
    } else {
      console.error('❌ ONE OR MORE CRITICAL INDEXES ARE MISSING!');
      console.log('========================================================\n');
      await mongoose.disconnect();
      process.exit(1);
    }

  } catch (error) {
    console.error(`Verification error: ${error.message}`);
    process.exit(1);
  }
};

verifyIndexes();
