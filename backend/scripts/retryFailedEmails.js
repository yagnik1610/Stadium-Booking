const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const EmailLog = require('../models/EmailLog');
const { getResendClient, getEmailFrom, getEmailReplyTo } = require('../config/resend');

const retryFailed = async () => {
  const isRetryMode = process.argv.includes('--retry');

  console.log('====================================================');
  console.log('       TRANSACTIONAL EMAIL RETRY & AUDIT TOOL       ');
  console.log(` Mode: ${isRetryMode ? '🔄 RETRY EXECUTION (Re-sending)' : '🔍 REPORT-ONLY (Dry Run)'}`);
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  const MAX_ATTEMPTS = 3;
  const failedEmails = await EmailLog.find({
    status: 'failed',
    attemptCount: { $lt: MAX_ATTEMPTS }
  }).sort({ createdAt: -1 });

  console.log(`Found ${failedEmails.length} failed email delivery record(s) eligible for retry (attempts < ${MAX_ATTEMPTS}):\n`);

  failedEmails.forEach((email, i) => {
    console.log(`  [${i + 1}] ID: ${email._id}`);
    console.log(`      Recipient: ${email.recipient}`);
    console.log(`      Type:      ${email.emailType}`);
    console.log(`      Subject:   ${email.subject}`);
    console.log(`      Attempts:  ${email.attemptCount} / ${MAX_ATTEMPTS}`);
    console.log(`      Error:     ${email.lastError || 'Unknown error'}`);
    console.log(`      Created:   ${email.createdAt.toISOString()}\n`);
  });

  if (isRetryMode) {
    if (failedEmails.length === 0) {
      console.log('No failed emails requiring retry.');
      await mongoose.disconnect();
      process.exit(0);
    }

    const resend = getResendClient();
    if (!resend) {
      console.error('❌ Cannot retry: RESEND_API_KEY is not configured in environment.');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('--- EXECUTING RETRIES ---');
    let succeeded = 0;
    let failedAgain = 0;

    for (const email of failedEmails) {
      try {
        email.attemptCount += 1;
        const from = getEmailFrom();
        const replyTo = getEmailReplyTo();

        const { data, error } = await resend.emails.send({
          from,
          to: [email.recipient],
          reply_to: replyTo,
          subject: email.subject,
          html: `<p>${email.subject}</p>`,
          text: email.subject
        });

        if (error) {
          email.lastError = error.message || JSON.stringify(error);
          await email.save();
          console.error(`  ✗ Re-send failed for ${email._id}: ${email.lastError}`);
          failedAgain++;
        } else {
          email.status = 'sent';
          email.providerMessageId = data?.id || '';
          email.sentAt = new Date();
          await email.save();
          console.log(`  ✓ Re-send succeeded for ${email._id} (Provider ID: ${data?.id})`);
          succeeded++;
        }
      } catch (err) {
        email.lastError = err.message;
        await email.save();
        console.error(`  ✗ Exception during re-send for ${email._id}: ${err.message}`);
        failedAgain++;
      }
    }

    console.log(`\nRetry Summary: ${succeeded} succeeded, ${failedAgain} failed.`);
  } else {
    console.log('Dry run complete. No emails were re-sent.');
    console.log('To execute retries, run: node scripts/retryFailedEmails.js --retry');
  }

  await mongoose.disconnect();
  console.log('\n====================================================');
  process.exit(0);
};

retryFailed().catch(err => {
  console.error('❌ Script failed:', err.message);
  process.exit(1);
});
