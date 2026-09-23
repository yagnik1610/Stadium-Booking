const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

const resetAdminPassword = async () => {
  try {
    await connectDB();

    if (!process.env.ADMIN_PASSWORD) {
      console.error('❌ Error: ADMIN_PASSWORD environment variable is required.');
      process.exit(1);
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@stadium.com';
    const newPassword = process.env.ADMIN_PASSWORD;
    
    // Access the native MongoDB collection directly
    const collection = mongoose.connection.db.collection('users');

    // Find all users with the admin email to distinguish between legacy and valid ones
    // (In case the script is run multiple times or valid admin already exists)
    const existingAdmins = await collection.find({ email: adminEmail, role: 'admin' }).toArray();
    
    let legacyAdmin = null;
    let validAdmin = null;

    for (const admin of existingAdmins) {
      if (typeof admin._id === 'string' && admin._id === 'user_admin_01') {
        legacyAdmin = admin;
      } else if (admin._id instanceof mongoose.Types.ObjectId) {
        validAdmin = admin;
      }
    }

    // Check if a valid admin already exists
    if (validAdmin && !legacyAdmin) {
      console.log('✅ A valid admin account already exists. No legacy account found.');
      console.log(`Email: ${validAdmin.email}`);
      process.exit(0);
    }

    // We must find the legacy admin directly if the email was already changed by a previous failed run
    if (!legacyAdmin) {
        legacyAdmin = await collection.findOne({ _id: 'user_admin_01' });
    }

    if (!legacyAdmin && !validAdmin) {
      console.error(`❌ Error: Admin user with email ${adminEmail} does not exist in the database.`);
      process.exit(1);
    }

    if (legacyAdmin) {
      console.log(`⚠️ Legacy admin found with string _id: ${legacyAdmin._id}`);
      
      // Temporarily change the legacy admin's email to avoid MongoDB E11000 unique index collision during insertion
      await collection.updateOne(
        { _id: legacyAdmin._id },
        { $set: { email: `legacy_temp_${legacyAdmin.email}` } }
      );

      // Hash password manually to ensure compatibility with User model's matchPassword
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Create replacement admin document with a valid ObjectId
      const replacementAdmin = {
        _id: new mongoose.Types.ObjectId(),
        name: legacyAdmin.name,
        email: adminEmail, // Restore the original correct email for the new doc
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      };

      // Insert the replacement admin first
      const result = await collection.insertOne(replacementAdmin);
      
      // Verify that the replacement document was successfully inserted
      if (result.insertedId) {
        console.log(`✅ Replacement admin created successfully with valid ObjectId: ${result.insertedId}`);
        
        // Only after successful insertion, delete the legacy document
        await collection.deleteOne({ _id: legacyAdmin._id });
        console.log(`🗑️ Legacy admin removed (${legacyAdmin._id})`);
        
        console.log('✅ Admin password reset successfully');
        console.log(`Email: ${adminEmail}`);
      } else {
        console.error('❌ Failed to insert replacement admin.');
        
        // Revert legacy email on failure so we don't lose the account
        await collection.updateOne(
          { _id: legacyAdmin._id },
          { $set: { email: adminEmail } }
        );
        process.exit(1);
      }
    }

    process.exit(0);

  } catch (error) {
    console.error(`❌ Error resetting admin password: ${error.message}`);
    process.exit(1);
  }
};

resetAdminPassword();
