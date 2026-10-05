const mongoose = require('mongoose');


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    try {
      const SlotLock = require('../models/SlotLock');
      await SlotLock.verifyAndEnsureIndexes();
      console.log('✅ Critical SlotLock unique index verified');

      const Payment = require('../models/Payment');
      await Payment.verifyAndEnsureIndexes();
      console.log('✅ Critical Payment partial unique index verified');

      const PaymentWebhookEvent = require('../models/PaymentWebhookEvent');
      await PaymentWebhookEvent.verifyAndEnsureIndexes();
      console.log('✅ Critical PaymentWebhookEvent unique index verified');

      const EmailLog = require('../models/EmailLog');
      await EmailLog.verifyAndEnsureIndexes();
      console.log('✅ Critical EmailLog idempotency unique index verified');

      const Booking = require('../models/Booking');
      await Booking.createIndexes();
    } catch (indexError) {
      console.error(`❌ Critical index verification failed: ${indexError.message}`);
      console.error('❌ Server startup aborted: Critical concurrency or idempotency indexes could not be guaranteed.');
      process.exit(1);
    }

  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
