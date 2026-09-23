const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const configureAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@stadium.com';
    const loginId = process.env.ADMIN_LOGIN_ID;
    const plainPassword = process.env.ADMIN_PASSWORD;

    if (!loginId || !plainPassword) {
      console.error('❌ Missing ADMIN_LOGIN_ID or ADMIN_PASSWORD in environment variables.');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const collection = mongoose.connection.db.collection('users');

    // Find if admin exists by role: 'admin' or by email or loginId
    const existingAdmin = await collection.findOne({
      $or: [{ role: 'admin' }, { email: adminEmail }, { loginId }]
    });

    if (existingAdmin) {
      await collection.updateOne(
        { _id: existingAdmin._id },
        {
          $set: {
            loginId: loginId,
            password: hashedPassword,
            role: 'admin',
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
      console.log(`✅ Admin account updated successfully:`);
      console.log(`   ID: ${existingAdmin._id}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Login ID: ${loginId}`);
    } else {
      const newAdmin = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Administrator',
        email: adminEmail,
        loginId: loginId,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        country: 'India',
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0
      };
      const res = await collection.insertOne(newAdmin);
      console.log(`✅ New Admin account created with ID: ${res.insertedId}`);
    }

    const verifiedAdmin = await collection.findOne({ loginId });
    console.log('Verified Admin Record:', {
      _id: verifiedAdmin._id,
      name: verifiedAdmin.name,
      email: verifiedAdmin.email,
      loginId: verifiedAdmin.loginId,
      role: verifiedAdmin.role,
      isActive: verifiedAdmin.isActive
    });

    process.exit(0);
  } catch (err) {
    console.error('Error configuring admin account:', err);
    process.exit(1);
  }
};

configureAdmin();
