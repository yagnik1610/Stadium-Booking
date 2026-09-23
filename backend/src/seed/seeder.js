const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { seedData } = require('./seedData');
const { memoryStore } = require('../config/memoryStore');
const User = require('../models/User');
const Stadium = require('../models/Stadium');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

const seedDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/stadium_booking';
  
  // 1. Seed Memory / JSON Store always
  memoryStore.seedDefaults();
  console.log('[Seeder] Local Store seeded successfully with stadiums, events, and users.');

  // 2. If Mongo is reachable, seed Mongo DB too
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    console.log(`[Seeder] Connected to MongoDB: ${conn.connection.host}`);

    await User.deleteMany();
    await Stadium.deleteMany();
    await Event.deleteMany();
    await Booking.deleteMany();

    await User.insertMany(seedData.users);
    await Stadium.insertMany(seedData.stadiums);
    await Event.insertMany(seedData.events);
    await Booking.insertMany(seedData.bookings);

    console.log('[Seeder] MongoDB populated successfully!');
    process.exit(0);
  } catch (error) {
    console.log('[Seeder] Note: MongoDB connection skipped (daemon not running), using active Local JSON Store.');
    process.exit(0);
  }
};

seedDB();
