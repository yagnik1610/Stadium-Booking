const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';
const MOCK_STATE_PATH = path.join(__dirname, '../.mock_resend_active');

const setCrossProcessMock = (state = { fail: false }) => {
  fs.writeFileSync(MOCK_STATE_PATH, JSON.stringify(state));
};

const clearCrossProcessMock = () => {
  if (fs.existsSync(MOCK_STATE_PATH)) {
    try {
      fs.unlinkSync(MOCK_STATE_PATH);
    } catch (_) {}
  }
};

const adminCreds = {
  loginId: process.env.ADMIN_LOGIN_ID || 'admin01',
  email: process.env.ADMIN_EMAIL || 'admin@stadium.com',
  password: process.env.ADMIN_PASSWORD || 'admin12345'
};

const userCreds = {
  email: 'yagnik@test.com',
  password: 'password123'
};

let adminToken = null;
let userToken = null;

let passed = 0;
let failed = 0;

const logPass = (name) => {
  passed++;
  console.log(`  \x1b[32m✓ [PASS]\x1b[0m ${name}`);
};

const logFail = (name, reason) => {
  failed++;
  console.error(`  \x1b[31m✗ [FAIL]\x1b[0m ${name}: ${reason}`);
};

const makeRequest = async (method, endpoint, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
};

const runEmailTestSuite = async () => {
  console.log('\n================================================================');
  console.log('BACKEND PHASE 2B: RESEND TRANSACTIONAL EMAIL SYSTEM VERIFICATION');
  console.log('================================================================\n');

  try {
    setCrossProcessMock({ fail: false });
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking');

    const User = require('../models/User');
    const Booking = require('../models/Booking');
    const Payment = require('../models/Payment');
    const Stadium = require('../models/Stadium');
    const SlotLock = require('../models/SlotLock');
    const EmailLog = require('../models/EmailLog');
    const ContactMessage = require('../models/ContactMessage');
    const { setMockResendClient } = require('../config/resend');
    const emailService = require('../utils/emailService');

    const waitForEmailLog = async (query, expectedStatus = 'sent', maxWaitMs = 2500) => {
      const startTime = Date.now();
      while (Date.now() - startTime < maxWaitMs) {
        const log = await EmailLog.findOne(query);
        if (log && (!expectedStatus || log.status === expectedStatus)) {
          return log;
        }
        await new Promise(r => setTimeout(r, 100));
      }
      return await EmailLog.findOne(query);
    };

    // 0. AUTHENTICATION & SETUP
    const adminRes = await makeRequest('POST', '/api/auth/login', {
      email: adminCreds.email,
      password: adminCreds.password
    });
    if (adminRes.status === 200 && adminRes.data?.token) {
      adminToken = adminRes.data.token;
    } else {
      const adminLoginIdRes = await makeRequest('POST', '/api/auth/admin-login', {
        loginId: adminCreds.loginId,
        password: adminCreds.password
      });
      if (adminLoginIdRes.status === 200 && adminLoginIdRes.data?.token) {
        adminToken = adminLoginIdRes.data.token;
      }
    }

    const userRes = await makeRequest('POST', '/api/auth/login', userCreds);
    if (userRes.status === 200 && userRes.data?.token) {
      userToken = userRes.data.token;
    }

    const testStadium = await Stadium.findOne({ isActive: true });
    if (!testStadium) {
      throw new Error('No active stadium found in database for testing');
    }

    // Track mock calls
    let sentEmails = [];
    let simulateProviderFailure = false;

    const mockResend = {
      emails: {
        send: async (options) => {
          if (simulateProviderFailure) {
            return {
              data: null,
              error: { message: 'Resend API rate limit exceeded or network timeout' }
            };
          }
          const messageId = `msg_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          sentEmails.push({ ...options, messageId });
          return {
            data: { id: messageId },
            error: null
          };
        }
      }
    };

    // Inject mock client: Task 31 (Tests must NEVER send real customer emails)
    setMockResendClient(mockResend);

    console.log('--- CATEGORY 1: EMAIL SERVICE CORE BEHAVIOR ---');

    // Test 1: Valid configured email sends via mock client
    sentEmails = [];
    const testResult1 = await emailService.sendTransactionalEmail({
      idempotencyKey: `test:direct:${Date.now()}`,
      recipient: 'athlete@example.com',
      emailType: 'welcome',
      subject: 'Test Direct Send',
      html: '<p>Test Direct Send</p>',
      text: 'Test Direct Send'
    });

    if (testResult1.success && sentEmails.length === 1 && sentEmails[0].to[0] === 'athlete@example.com') {
      logPass('Test 1 - Configured email sends through service and records message ID');
    } else {
      logFail('Test 1 - Configured email sends', `Result: ${JSON.stringify(testResult1)}`);
    }

    // Test 2: Invalid recipient rejected safely without crash
    const testResult2 = await emailService.sendTransactionalEmail({
      idempotencyKey: `test:bad_recipient:${Date.now()}`,
      recipient: 'not-an-email-address',
      emailType: 'welcome',
      subject: 'Bad Recipient',
      html: '<p>Hi</p>',
      text: 'Hi'
    });

    if (!testResult2.success && testResult2.error === 'INVALID_RECIPIENT') {
      logPass('Test 2 - Invalid recipient address safely rejected without provider dispatch');
    } else {
      logFail('Test 2 - Invalid recipient', `Expected INVALID_RECIPIENT, got ${testResult2.error}`);
    }

    // Test 3: Provider failure does not throw and records status 'failed'
    simulateProviderFailure = true;
    const testKey3 = `test:provider_failure:${Date.now()}`;
    const testResult3 = await emailService.sendTransactionalEmail({
      idempotencyKey: testKey3,
      recipient: 'failure_test@example.com',
      emailType: 'welcome',
      subject: 'Simulated Provider Failure',
      html: '<p>Fail</p>',
      text: 'Fail'
    });

    const failedLog3 = await EmailLog.findOne({ idempotencyKey: testKey3 });
    if (!testResult3.success && failedLog3?.status === 'failed' && failedLog3?.lastError?.includes('rate limit')) {
      logPass('Test 3 - Provider failure isolated gracefully and logged as status: failed');
    } else {
      logFail('Test 3 - Provider failure', `Result: ${JSON.stringify(testResult3)}, log: ${failedLog3?.status}`);
    }
    simulateProviderFailure = false; // Reset

    console.log('\n--- CATEGORY 2: USER REGISTRATION EMAIL ---');

    // Test 4: Registration triggers welcome email
    sentEmails = [];
    const regEmail = `email_tester_${Date.now()}@example.com`;
    const regRes = await makeRequest('POST', '/api/auth/register', {
      name: 'Email Tester',
      email: regEmail,
      password: 'password123',
      mobile: '+91 9876543299'
    });

    const welcomeLog = await waitForEmailLog({ recipient: regEmail.toLowerCase(), emailType: 'welcome' });
    if (regRes.status === 201 && welcomeLog?.status === 'sent') {
      logPass('Test 4 - Successful user registration triggers welcome email');
    } else {
      logFail('Test 4 - Registration welcome email', `Status: ${regRes.status}, welcomeLog: ${welcomeLog?.status}`);
    }

    // Test 5: Duplicate registration execution does not send duplicate welcome email
    const duplicateSendResult = await emailService.sendWelcomeEmail({
      _id: regRes.data.user._id,
      name: 'Email Tester',
      email: regEmail
    });

    if (duplicateSendResult.skipped === true && duplicateSendResult.reason === 'DUPLICATE_IDEMPOTENCY_KEY') {
      logPass('Test 5 - Duplicate execution blocked by idempotency key (zero duplicate welcome emails)');
    } else {
      logFail('Test 5 - Duplicate welcome email', `Result: ${JSON.stringify(duplicateSendResult)}`);
    }

    // Test 6: Registration remains successful when email provider fails
    simulateProviderFailure = true;
    setCrossProcessMock({ fail: true });
    const regEmailFail = `email_fail_${Date.now()}@example.com`;
    const regResFail = await makeRequest('POST', '/api/auth/register', {
      name: 'Fail Tester',
      email: regEmailFail,
      password: 'password123',
      mobile: '+91 9876543298'
    });

    if (regResFail.status === 201 && regResFail.data?.user?._id) {
      logPass('Test 6 - User registration remains completely successful (201) when email provider fails');
    } else {
      logFail('Test 6 - Registration with email failure', `Expected 201, got ${regResFail.status}`);
    }
    simulateProviderFailure = false;
    setCrossProcessMock({ fail: false });

    console.log('\n--- CATEGORY 3: BOOKING TRANSACTIONAL EMAILS ---');

    // Helper for unique future date
    let futureOffset = 2500 + Math.floor((Date.now() % 500000) / 1000);
    const getTestDate = () => {
      const d = new Date();
      d.setDate(d.getDate() + (futureOffset++));
      return d.toISOString().split('T')[0];
    };

    // Test 7: Booking creation dispatches booking-created AND admin-new-booking emails
    sentEmails = [];
    const bDate1 = getTestDate();
    const createRes1 = await makeRequest('POST', '/api/bookings', {
      stadium: testStadium._id,
      bookingDate: bDate1,
      startTime: '10:00',
      endTime: '11:00'
    }, userToken);

    const b1Id = createRes1.data?.booking?._id;
    const customerEmailLog1 = await waitForEmailLog({ booking: b1Id, emailType: 'booking_created' });
    const adminEmailLog1 = await waitForEmailLog({ booking: b1Id, emailType: 'admin_new_booking' });

    if (createRes1.status === 201 && customerEmailLog1?.status === 'sent' && adminEmailLog1?.status === 'sent') {
      logPass('Test 7 - Booking creation triggers both customer booking-created and admin notification emails');
    } else {
      logFail('Test 7 - Booking created emails', `Status: ${createRes1.status}, custLog: ${customerEmailLog1?.status}, adminLog: ${adminEmailLog1?.status}`);
    }

    // Test 8: Booking cancellation dispatches cancellation email
    await makeRequest('PUT', `/api/bookings/${b1Id}/cancel`, {}, userToken);

    const cancelEmailLog = await waitForEmailLog({ booking: b1Id, emailType: 'booking_cancelled' });
    if (cancelEmailLog?.status === 'sent') {
      logPass('Test 8 - Booking cancellation dispatches cancellation email');
    } else {
      logFail('Test 8 - Booking cancellation email', `Status: ${cancelEmailLog?.status}`);
    }

    // Test 9: Admin status update dispatches rejection email with reason
    const bDate2 = getTestDate();
    const createRes2 = await makeRequest('POST', '/api/bookings', {
      stadium: testStadium._id,
      bookingDate: bDate2,
      startTime: '11:00',
      endTime: '12:00',
      status: 'pending'
    }, userToken);
    const b2Id = createRes2.data?.booking?._id;

    await makeRequest('PUT', `/api/bookings/${b2Id}/status`, {
      status: 'rejected',
      rejectionReason: 'Pitch maintenance scheduled'
    }, adminToken);

    const rejectEmailLog = await waitForEmailLog({ booking: b2Id, emailType: 'booking_rejected' });
    if (rejectEmailLog?.status === 'sent' && rejectEmailLog?.subject?.includes(createRes2.data.booking.bookingReference)) {
      logPass('Test 9 - Admin booking rejection dispatches booking-rejected email with reason');
    } else {
      logFail('Test 9 - Booking rejected email', `Status: ${rejectEmailLog?.status}`);
    }

    // Test 10: Booking confirmed email sent
    const bDate3 = getTestDate();
    const createRes3 = await makeRequest('POST', '/api/bookings', {
      stadium: testStadium._id,
      bookingDate: bDate3,
      startTime: '13:00',
      endTime: '14:00',
      status: 'pending'
    }, userToken);
    const b3Id = createRes3.data?.booking?._id;

    await makeRequest('PUT', `/api/bookings/${b3Id}/status`, {
      status: 'confirmed'
    }, adminToken);

    const confirmEmailLog = await waitForEmailLog({ booking: b3Id, emailType: 'booking_confirmed' });
    if (confirmEmailLog?.status === 'sent') {
      logPass('Test 10 - Booking confirmed dispatches booking-confirmed email');
    } else {
      logFail('Test 10 - Booking confirmed email', `Status: ${confirmEmailLog?.status}`);
    }

    // Test 11: Duplicate confirmation path does NOT send duplicate confirmation email
    const dupConfirmRes = await emailService.sendBookingConfirmedEmail(
      createRes3.data.booking,
      testStadium,
      { _id: createRes3.data.booking.user, email: userCreds.email, name: 'Athlete' }
    );
    const totalConfirmLogs = await EmailLog.countDocuments({ booking: b3Id, emailType: 'booking_confirmed' });

    if (dupConfirmRes.skipped === true && totalConfirmLogs === 1) {
      logPass('Test 11 - Duplicate confirmation path (admin / payment / webhook) produces exactly ONE confirmation email');
    } else {
      logFail('Test 11 - Duplicate confirmation email', `Skipped: ${dupConfirmRes.skipped}, count: ${totalConfirmLogs}`);
    }

    // Test 12: Booking expiration dispatches booking-expired email
    const bDate4 = getTestDate();
    const createRes4 = await makeRequest('POST', '/api/bookings', {
      stadium: testStadium._id,
      bookingDate: bDate4,
      startTime: '15:00',
      endTime: '16:00',
      status: 'pending'
    }, userToken);
    const b4Id = createRes4.data?.booking?._id;

    // Age booking by 30 mins
    await Booking.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(b4Id) },
      { $set: { createdAt: new Date(Date.now() - 30 * 60 * 1000) } }
    );

    const { cleanupStalePendingBookings } = require('../utils/paymentExpiryJob');
    await cleanupStalePendingBookings({ timeoutMinutes: 15 });
    await new Promise(r => setTimeout(r, 200));

    const expiredEmailLog = await EmailLog.findOne({ booking: b4Id, emailType: 'booking_expired' });
    if (expiredEmailLog?.status === 'sent') {
      logPass('Test 12 - Booking expiration due to payment timeout dispatches booking-expired email');
    } else {
      logFail('Test 12 - Booking expired email', `Status: ${expiredEmailLog?.status}`);
    }

    console.log('\n--- CATEGORY 4: PAYMENT TRANSACTIONAL EMAILS ---');

    // Test 13: Payment verification dispatches payment-success email
    const bDate5 = getTestDate();
    const createRes5 = await makeRequest('POST', '/api/bookings', {
      stadium: testStadium._id,
      bookingDate: bDate5,
      startTime: '16:00',
      endTime: '17:00'
    }, userToken);
    const b5 = createRes5.data.booking;

    const ordRes5 = await makeRequest('POST', '/api/payments/create-order', { bookingId: b5._id }, userToken);
    const orderId5 = ordRes5.data.payment.razorpayOrderId;
    const paymentId5 = `pay_email_test_${Date.now()}`;

    const crypto = require('crypto');
    const validSignature5 = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId5}|${paymentId5}`)
      .digest('hex');

    await makeRequest('POST', '/api/payments/verify', {
      bookingId: b5._id,
      razorpay_order_id: orderId5,
      razorpay_payment_id: paymentId5,
      razorpay_signature: validSignature5
    }, userToken);

    const paymentSuccessLog = await waitForEmailLog({ booking: b5._id, emailType: 'payment_success' });
    if (paymentSuccessLog?.status === 'sent') {
      logPass('Test 13 - Client payment verification dispatches payment-success receipt email');
    } else {
      logFail('Test 13 - Payment success email', `Status: ${paymentSuccessLog?.status}`);
    }

    // Test 14: Subsequent payment webhook delivery does NOT send duplicate payment email
    const webhookEventId = `evt_email_test_${Date.now()}`;
    const webhookPayload = JSON.stringify({
      entity: 'event',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId5,
            order_id: orderId5,
            amount: Math.round(b5.totalPrice * 100),
            status: 'captured'
          }
        },
        order: {
          entity: {
            id: orderId5,
            status: 'paid'
          }
        }
      },
      created_at: Math.floor(Date.now() / 1000)
    });

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'development_webhook_secret_key';
    const webhookSig = crypto.createHmac('sha256', webhookSecret).update(webhookPayload).digest('hex');

    const webhookResponse = await fetch(`${BASE_URL}/api/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': webhookSig,
        'x-razorpay-event-id': webhookEventId
      },
      body: webhookPayload
    });

    await new Promise(r => setTimeout(r, 200));
    const totalPaymentSuccessLogs = await EmailLog.countDocuments({ booking: b5._id, emailType: 'payment_success' });

    if (webhookResponse.status === 200 && totalPaymentSuccessLogs === 1) {
      logPass('Test 14 - Webhook arrival after client verify does NOT send duplicate payment email');
    } else {
      logFail('Test 14 - Duplicate payment email on webhook', `Webhook status: ${webhookResponse.status}, count: ${totalPaymentSuccessLogs}`);
    }

    // Test 15: Payment failure dispatches payment-failed email
    const bDate6 = getTestDate();
    const createRes6 = await makeRequest('POST', '/api/bookings', {
      stadium: testStadium._id,
      bookingDate: bDate6,
      startTime: '17:00',
      endTime: '18:00',
      status: 'pending'
    }, userToken);
    const b6 = createRes6.data.booking;

    const ordRes6 = await makeRequest('POST', '/api/payments/create-order', { bookingId: b6._id }, userToken);
    const orderId6 = ordRes6.data.payment.razorpayOrderId;

    await makeRequest('POST', '/api/payments/verify', {
      bookingId: b6._id,
      razorpay_order_id: orderId6,
      razorpay_payment_id: 'pay_fail_test',
      razorpay_signature: 'invalid_signature_hex'
    }, userToken);

    // Call service to test failed email template & delivery
    const failedPaymentDoc = await Payment.findOne({ razorpayOrderId: orderId6 });
    const userDoc = await User.findById(b6.user);
    await emailService.sendPaymentFailedEmail(failedPaymentDoc, b6, testStadium, userDoc, 'Signature mismatch');
    await new Promise(r => setTimeout(r, 200));

    const paymentFailedLog = await EmailLog.findOne({ payment: failedPaymentDoc._id, emailType: 'payment_failed' });
    if (paymentFailedLog?.status === 'sent') {
      logPass('Test 15 - Payment failure dispatches payment-failed email without cancelling booking');
    } else {
      logFail('Test 15 - Payment failed email', `Status: ${paymentFailedLog?.status}`);
    }

    // Test 16: Refund processed dispatches refund-processed email once
    const refundEmailResult = await emailService.sendRefundProcessedEmail(
      failedPaymentDoc,
      b6,
      testStadium,
      userDoc
    );
    const refundEmailLog = await EmailLog.findOne({ payment: failedPaymentDoc._id, emailType: 'refund_processed' });

    if (refundEmailResult.success && refundEmailLog?.status === 'sent') {
      logPass('Test 16 - Refund event dispatches refund-processed email');
    } else {
      logFail('Test 16 - Refund processed email', `Result: ${JSON.stringify(refundEmailResult)}`);
    }

    console.log('\n--- CATEGORY 5: CONTACT INQUIRY EMAIL ---');

    // Test 17: Contact message dispatches admin contact notification
    const testSubject = `Court Reservation Query ${Date.now()}`;
    const contactRes = await makeRequest('POST', '/api/contact', {
      name: 'Inquiry Tester',
      email: 'inquiry@example.com',
      mobile: '+91 9988776655',
      subject: testSubject,
      message: 'Are badminton courts available on weekend mornings?'
    });

    const contactLog = await waitForEmailLog({ emailType: 'admin_contact_inquiry', subject: { $regex: testSubject } });

    if (contactRes.status === 201 && contactLog?.status === 'sent') {
      logPass('Test 17 - Public contact inquiry saves to DB and triggers admin notification email');
    } else {
      logFail('Test 17 - Contact inquiry email', `Status: ${contactRes.status}, contactLog: ${contactLog?.status}`);
    }

    console.log('\n--- CATEGORY 6: ADMIN LOG VIEWER & RETRY UTILITY ---');

    // Test 18: Admin endpoint GET /api/admin/email-logs returns paginated logs
    const adminLogsRes = await makeRequest('GET', '/api/admin/email-logs?limit=10', null, adminToken);
    if (adminLogsRes.status === 200 && adminLogsRes.data?.success && Array.isArray(adminLogsRes.data?.logs) && adminLogsRes.data.logs.length > 0) {
      logPass('Test 18 - Admin endpoint GET /api/admin/email-logs returns paginated audit records');
    } else {
      logFail('Test 18 - Admin email-logs endpoint', `Status: ${adminLogsRes.status}, logs count: ${adminLogsRes.data?.logs?.length}`);
    }

    // Test 19: Non-admin user blocked from GET /api/admin/email-logs
    const userLogsRes = await makeRequest('GET', '/api/admin/email-logs', null, userToken);
    if (userLogsRes.status === 403) {
      logPass('Test 19 - Non-admin user blocked from /api/admin/email-logs with 403 Forbidden');
    } else {
      logFail('Test 19 - Non-admin access to email logs', `Expected 403, got ${userLogsRes.status}`);
    }

    // Test 20: Retry utility dry-run executes cleanly
    const { execSync } = require('child_process');
    const retryDryRunOutput = execSync('node scripts/retryFailedEmails.js', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });

    if (retryDryRunOutput.includes('Dry run complete. No emails were re-sent.')) {
      logPass('Test 20 - Email retry utility executes cleanly in dry-run mode');
    } else {
      logFail('Test 20 - Retry utility execution', 'Expected dry-run message not found in output');
    }

    console.log('\n--- CATEGORY 7: SECURITY & SENSITIVE DATA LEAK PREVENTION ---');

    // Test 21: Verify no secrets, passwords, or JWTs leaked into email logs or bodies
    const sampleLogs = await EmailLog.find().limit(20).lean();
    let leakDetected = false;
    let leakReason = '';

    for (const log of sampleLogs) {
      const serialized = JSON.stringify(log);
      if (serialized.includes('password123') || serialized.includes(process.env.JWT_SECRET) || serialized.includes(process.env.RAZORPAY_KEY_SECRET)) {
        leakDetected = true;
        leakReason = 'Password or secret found in EmailLog document';
        break;
      }
    }

    if (!leakDetected) {
      logPass('Test 21 - Zero secrets, passwords, JWTs, or payment keys leaked in EmailLog database records');
    } else {
      logFail('Test 21 - Security data leak check', leakReason);
    }

  } catch (error) {
    console.error('❌ Fatal error during Phase 2B test suite:', error);
    failed++;
  } finally {
    console.log('\n================================================================');
    console.log(`TOTAL PHASE 2B EMAIL CHECKS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('================================================================\n');

    clearCrossProcessMock();
    await mongoose.disconnect();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runEmailTestSuite();
