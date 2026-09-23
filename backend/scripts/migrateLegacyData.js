const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection.db;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const migrateData = async () => {
  const db = await connectDB();

  console.log('--- STARTING LEGACY MIGRATION ---');

  try {
    // 1. Migrate Users
    console.log('\nScanning users...');
    const users = await User.find({});
    let usersUpdated = 0;

    for (const user of users) {
      let needsSave = false;
      if (user.isActive === undefined) {
        user.isActive = true;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
        usersUpdated++;
        console.log(`User ${user.email} migrated.`);
      }
    }
    console.log(`Total users migrated: ${usersUpdated}`);

    // 2. Migrate Stadiums (Native Driver)
    console.log('\nScanning stadiums natively...');
    
    const adminUser = await User.findOne({ role: 'admin' });
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    const collection = db.collection('stadia');
    const stadiums = await collection.find({ $or: [{ pricePerHour: { $exists: false } }, { isActive: { $exists: false } }] }).toArray();
    let stadiumsUpdated = 0;

    for (const stadium of stadiums) {
      const isStringId = typeof stadium._id === 'string';
      
      const hourlyRate = stadium.hourlyRate;
      let price = 1000;
      if (hourlyRate) price = hourlyRate * 100;
      if (price < 100) price = 1000;

      let opening = '06:00';
      let closing = '22:00';

      const operatingHours = stadium.operatingHours;
      if (operatingHours && operatingHours.open) {
        if (operatingHours.open.includes('AM')) opening = operatingHours.open.replace(' AM', '');
        else if (operatingHours.open.includes('PM')) {
          const parts = operatingHours.open.replace(' PM', '').split(':');
          let hr = parseInt(parts[0]);
          if (hr !== 12) hr += 12;
          opening = `${hr.toString().padStart(2, '0')}:${parts[1]}`;
        }
      }
      if (operatingHours && operatingHours.close) {
        if (operatingHours.close.includes('AM')) closing = operatingHours.close.replace(' AM', '');
        else if (operatingHours.close.includes('PM')) {
          const parts = operatingHours.close.replace(' PM', '').split(':');
          let hr = parseInt(parts[0]);
          if (hr !== 12) hr += 12;
          closing = `${hr.toString().padStart(2, '0')}:${parts[1]}`;
        }
      }

      const updateData = {
        pricePerHour: price,
        openingTime: opening,
        closingTime: closing,
        isActive: true,
        location: stadium.location || stadium.city || 'Unknown Location',
        contactNumber: stadium.contactNumber || '0000000000',
        createdBy: stadium.createdBy || adminId,
        createdAt: stadium.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (isStringId) {
        // Must insert new doc with ObjectId and delete old
        const newDoc = {
          ...stadium,
          ...updateData,
          _id: new mongoose.Types.ObjectId()
        };
        await collection.insertOne(newDoc);
        await collection.deleteOne({ _id: stadium._id });
        console.log(`Stadium "${stadium.name}" migrated (ID transformed to ObjectId).`);
      } else {
        await collection.updateOne({ _id: stadium._id }, { $set: updateData });
        console.log(`Stadium "${stadium.name}" migrated (in-place).`);
      }
      
      stadiumsUpdated++;
    }

    console.log(`Total stadiums migrated: ${stadiumsUpdated}`);
    console.log('--- MIGRATION COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrateData();
