/**
 * Production Readiness Diagnostic Script: Pre-flight Configuration Check (Step 57)
 *
 * Verifies environment configuration, database connectivity, critical indexes,
 * and service integrations prior to production deployment.
 * NEVER prints secret values.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const padRight = (str, len) => str.padEnd(len, '.');

const runChecks = async () => {
  console.log('\n============================================================');
  console.log('🚀 STADIUM BOOKING SYSTEM: PRODUCTION READINESS PRE-FLIGHT');
  console.log('============================================================\n');

  const isProduction = process.env.NODE_ENV === 'production';
  let allPassed = true;

  const check = (name, condition, details = '') => {
    const status = condition ? 'PASS' : (isProduction ? 'FAIL' : 'WARN');
    if (!condition && isProduction) allPassed = false;
    const padding = padRight(name + ' ', 45);
    console.log(`${padding} [${status}] ${details}`);
    return condition;
  };

  const criticalCheck = (name, condition, details = '') => {
    const status = condition ? 'PASS' : 'FAIL';
    if (!condition) allPassed = false;
    const padding = padRight(name + ' ', 45);
    console.log(`${padding} [${status}] ${details}`);
    return condition;
  };

  // 1. Environment Variables Check
  console.log('--- 1. ENVIRONMENT CONFIGURATION ---');
  criticalCheck('MONGO_URI Configured', !!process.env.MONGO_URI);
  criticalCheck('JWT_SECRET Configured', !!process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16);
  check('NODE_ENV Defined', !!process.env.NODE_ENV, `Current: ${process.env.NODE_ENV || 'undefined'}`);
  check('CLIENT_URL Configured', !!process.env.CLIENT_URL, `Value: ${process.env.CLIENT_URL || 'Not Set'}`);
  check('PORT Configured', !!process.env.PORT, `Port: ${process.env.PORT || 5000}`);

  // 2. Payment Gateway Configuration
  console.log('\n--- 2. PAYMENT GATEWAY (RAZORPAY) ---');
  check('Razorpay Key ID', !!process.env.RAZORPAY_KEY_ID);
  check('Razorpay Key Secret', !!process.env.RAZORPAY_KEY_SECRET);
  check('Razorpay Webhook Secret', !!process.env.RAZORPAY_WEBHOOK_SECRET);

  // 3. External Services Configuration
  console.log('\n--- 3. TRANSACTIONAL EMAIL & MEDIA STORAGE ---');
  check('Resend API Key', !!process.env.RESEND_API_KEY);
  check('Cloudinary Cloud Name', !!process.env.CLOUDINARY_CLOUD_NAME);
  check('Cloudinary API Key', !!process.env.CLOUDINARY_API_KEY);
  check('Cloudinary API Secret', !!process.env.CLOUDINARY_API_SECRET);

  // 4. Database Connectivity and Critical Indexes
  console.log('\n--- 4. MONGODB CONNECTIVITY & CRITICAL INDEXES ---');
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    criticalCheck('MongoDB Reachable', true, `Connected: ${mongoose.connection.host}`);

    // Check SlotLock unique index
    const SlotLock = require('../models/SlotLock');
    const slotIndexes = await SlotLock.collection.indexes();
    const hasSlotLockIndex = slotIndexes.some(idx =>
      idx.key && idx.key.stadium === 1 && idx.key.bookingDate === 1 && idx.key.timeSlot === 1 && idx.unique
    );
    criticalCheck('SlotLock Compound Unique Index', hasSlotLockIndex);

    // Check Payment index
    const Payment = require('../models/Payment');
    const paymentIndexes = await Payment.collection.indexes();
    const hasPaymentIndex = paymentIndexes.some(idx =>
      idx.key && (idx.key.razorpayOrderId === 1 || idx.key.booking === 1)
    );
    criticalCheck('Payment Financial Indexes', hasPaymentIndex);

    // Check PaymentWebhookEvent unique index
    const PaymentWebhookEvent = require('../models/PaymentWebhookEvent');
    const webhookIndexes = await PaymentWebhookEvent.collection.indexes();
    const hasWebhookIndex = webhookIndexes.some(idx =>
      idx.key && idx.key.eventId === 1 && idx.unique
    );
    criticalCheck('PaymentWebhookEvent Unique Index', hasWebhookIndex);

    // Check EmailLog unique idempotency index
    const EmailLog = require('../models/EmailLog');
    const emailIndexes = await EmailLog.collection.indexes();
    const hasEmailIndex = emailIndexes.some(idx =>
      idx.key && idx.key.idempotencyKey === 1 && idx.unique
    );
    criticalCheck('EmailLog Idempotency Index', hasEmailIndex);

    // Check System Settings
    const Setting = require('../models/Setting');
    const settings = await Setting.findOne().lean();
    check('System Settings Document', !!settings, settings ? `Business: "${settings.businessName}"` : 'Default settings will be initialized');

    await mongoose.connection.close();
  } catch (dbErr) {
    criticalCheck('MongoDB Reachable', false, dbErr.message);
  }

  console.log('\n============================================================');
  if (allPassed) {
    console.log('🎉 ALL PRODUCTION CHECKS VERIFIED SUCCESSFULLY');
  } else {
    console.log('⚠️ PRODUCTION PRE-FLIGHT COMPLETED WITH WARNINGS / FAILURES');
    console.log('Review above items before deploying to live production.');
  }
  console.log('============================================================\n');

  process.exit(allPassed ? 0 : 1);
};

runChecks();
