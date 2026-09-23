const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

dotenv.config();

const fixBookingIndex = async () => {
  try {
    await connectDB();
    const collection = mongoose.connection.db.collection('bookings');
    
    // Check existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    // Drop the problematic bookingId_1 index if it exists
    const hasBookingIdIndex = indexes.some(index => index.name === 'bookingId_1');
    if (hasBookingIdIndex) {
      await collection.dropIndex('bookingId_1');
      console.log('✅ Successfully dropped obsolete index: bookingId_1');
    } else {
      console.log('✅ Index bookingId_1 not found, nothing to do.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing index:', error.message);
    process.exit(1);
  }
};

fixBookingIndex();
