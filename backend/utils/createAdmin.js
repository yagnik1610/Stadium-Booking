const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if an admin already exists
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('An admin user already exists. Seed aborted to prevent duplicates.');
      process.exit();
    }

    if (!process.env.ADMIN_PASSWORD) {
      console.error('❌ Error: ADMIN_PASSWORD environment variable is required.');
      process.exit(1);
    }

    if (!process.env.ADMIN_EMAIL) {
      console.error('❌ Error: ADMIN_EMAIL environment variable is required.');
      process.exit(1);
    }

    const adminName = process.env.ADMIN_NAME || 'Super Admin';
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD; // Will be hashed by pre('save') hook

    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    process.exit();

  } catch (error) {
    console.error(`❌ Error creating admin: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
