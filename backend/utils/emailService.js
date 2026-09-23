const EmailLog = require('../models/EmailLog');
const {
  getResendClient,
  getEmailFrom,
  getEmailReplyTo,
  getAdminNotificationEmail
} = require('../config/resend');

const { getWelcomeEmail } = require('../emails/welcomeEmail');
const { getBookingCreatedEmail } = require('../emails/bookingCreatedEmail');
const { getBookingConfirmedEmail } = require('../emails/bookingConfirmedEmail');
const { getBookingRejectedEmail } = require('../emails/bookingRejectedEmail');
const { getBookingCancelledEmail } = require('../emails/bookingCancelledEmail');
const { getBookingExpiredEmail } = require('../emails/bookingExpiredEmail');
const { getPaymentSuccessEmail } = require('../emails/paymentSuccessEmail');
const { getPaymentFailedEmail } = require('../emails/paymentFailedEmail');
const { getRefundProcessedEmail } = require('../emails/refundProcessedEmail');
const { getAdminNewBookingEmail } = require('../emails/adminNewBookingEmail');
const { getAdminContactEmail } = require('../emails/adminContactEmail');

/**
 * Base transactional email dispatcher with database-backed idempotency and failure isolation.
 */
const sendTransactionalEmail = async ({
  idempotencyKey,
  recipient,
  emailType,
  subject,
  html,
  text,
  user = null,
  booking = null,
  payment = null,
  metadata = null
}) => {
  try {
    // 1. Recipient validation and normalization
    if (!recipient || typeof recipient !== 'string' || !recipient.includes('@')) {
      console.warn(`[EMAIL_SKIPPED] [${emailType}] Invalid recipient address: ${recipient}`);
      return { success: false, error: 'INVALID_RECIPIENT' };
    }
    const cleanRecipient = recipient.trim().toLowerCase();

    // 2. Database-backed atomic idempotency guard
    let emailLog;
    try {
      emailLog = await EmailLog.create({
        user,
        booking,
        payment,
        recipient: cleanRecipient,
        emailType,
        idempotencyKey,
        subject,
        status: 'queued',
        metadata
      });
    } catch (err) {
      if (err.code === 11000) {
        console.log(`[EMAIL_SKIPPED_DUPLICATE] [${idempotencyKey}] Email already queued or sent.`);
        return { success: true, skipped: true, reason: 'DUPLICATE_IDEMPOTENCY_KEY' };
      }
      console.error('❌ Failed to record EmailLog:', err.message);
      return { success: false, error: err.message };
    }

    // 3. Provider check (graceful simulation if unconfigured in development)
    const resend = getResendClient();
    if (!resend) {
      emailLog.status = 'skipped';
      emailLog.lastError = 'RESEND_API_KEY not configured';
      await emailLog.save();
      console.log(`[EMAIL_CONFIG_MISSING] [${emailType}] ${cleanRecipient} - Email skipped (RESEND_API_KEY not configured).`);
      return { success: true, skipped: true, reason: 'DEV_NO_KEY' };
    }

    // 4. Send via Resend client
    try {
      const from = getEmailFrom();
      const replyTo = getEmailReplyTo();

      const { data, error } = await resend.emails.send({
        from,
        to: [cleanRecipient],
        reply_to: replyTo,
        subject,
        html,
        text
      });

      if (error) {
        emailLog.status = 'failed';
        emailLog.lastError = error.message || JSON.stringify(error);
        await emailLog.save();
        console.error(`[EMAIL_FAILED] [${emailType}] ${cleanRecipient} - ${emailLog.lastError}`);
        return { success: false, error: emailLog.lastError };
      }

      emailLog.status = 'sent';
      emailLog.providerMessageId = data?.id || '';
      emailLog.sentAt = new Date();
      await emailLog.save();
      console.log(`[EMAIL_SENT] [${emailType}] ${cleanRecipient} - Provider ID: ${data?.id}`);
      return { success: true, messageId: data?.id };

    } catch (sendErr) {
      emailLog.status = 'failed';
      emailLog.lastError = sendErr.message;
      await emailLog.save().catch(() => {});
      console.error(`[EMAIL_FAILED] [${emailType}] ${cleanRecipient} - Exception: ${sendErr.message}`);
      return { success: false, error: sendErr.message };
    }

  } catch (outerErr) {
    // Non-negotiable: Email failure must NEVER crash caller transactions
    console.error('❌ Unexpected email dispatch error:', outerErr.message);
    return { success: false, error: outerErr.message };
  }
};

// Specialized Helper Functions
const sendWelcomeEmail = async (user) => {
  const { subject, html, text } = getWelcomeEmail({ name: user.name });
  return sendTransactionalEmail({
    idempotencyKey: `welcome:${user._id}`,
    recipient: user.email,
    emailType: 'welcome',
    subject,
    html,
    text,
    user: user._id
  });
};

const sendBookingCreatedEmail = async (booking, stadium, user) => {
  const { subject, html, text } = getBookingCreatedEmail({ booking, stadium, user });
  return sendTransactionalEmail({
    idempotencyKey: `booking-created:${booking._id}`,
    recipient: user.email,
    emailType: 'booking_created',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id
  });
};

const sendBookingConfirmedEmail = async (booking, stadium, user, payment = null) => {
  const { subject, html, text } = getBookingConfirmedEmail({ booking, stadium, user, payment });
  return sendTransactionalEmail({
    idempotencyKey: `booking-confirmed:${booking._id}`,
    recipient: user.email,
    emailType: 'booking_confirmed',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id,
    payment: payment?._id
  });
};

const sendBookingRejectedEmail = async (booking, stadium, user, reason) => {
  const { subject, html, text } = getBookingRejectedEmail({ booking, stadium, user, reason });
  return sendTransactionalEmail({
    idempotencyKey: `booking-rejected:${booking._id}`,
    recipient: user.email,
    emailType: 'booking_rejected',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id
  });
};

const sendBookingCancelledEmail = async (booking, stadium, user, refundStatus = null) => {
  const { subject, html, text } = getBookingCancelledEmail({ booking, stadium, user, refundStatus });
  return sendTransactionalEmail({
    idempotencyKey: `booking-cancelled:${booking._id}`,
    recipient: user.email,
    emailType: 'booking_cancelled',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id
  });
};

const sendBookingExpiredEmail = async (booking, stadium, user) => {
  const { subject, html, text } = getBookingExpiredEmail({ booking, stadium, user });
  return sendTransactionalEmail({
    idempotencyKey: `booking-expired:${booking._id}`,
    recipient: user.email,
    emailType: 'booking_expired',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id
  });
};

const sendPaymentSuccessEmail = async (payment, booking, stadium, user) => {
  const { subject, html, text } = getPaymentSuccessEmail({ payment, booking, stadium, user });
  return sendTransactionalEmail({
    idempotencyKey: `payment-success:${payment._id}`,
    recipient: user.email,
    emailType: 'payment_success',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id,
    payment: payment._id
  });
};

const sendPaymentFailedEmail = async (payment, booking, stadium, user, reason) => {
  const { subject, html, text } = getPaymentFailedEmail({ payment, booking, stadium, user, reason });
  return sendTransactionalEmail({
    idempotencyKey: `payment-failed:${payment._id}`,
    recipient: user.email,
    emailType: 'payment_failed',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id,
    payment: payment._id
  });
};

const sendRefundProcessedEmail = async (payment, booking, stadium, user) => {
  const { subject, html, text } = getRefundProcessedEmail({ payment, booking, stadium, user });
  return sendTransactionalEmail({
    idempotencyKey: `refund-processed:${payment._id}`,
    recipient: user.email,
    emailType: 'refund_processed',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id,
    payment: payment._id
  });
};

const sendAdminNewBookingEmail = async (booking, stadium, user) => {
  const adminEmail = getAdminNotificationEmail();
  const { subject, html, text } = getAdminNewBookingEmail({ booking, stadium, user });
  return sendTransactionalEmail({
    idempotencyKey: `admin-new-booking:${booking._id}`,
    recipient: adminEmail,
    emailType: 'admin_new_booking',
    subject,
    html,
    text,
    user: user._id,
    booking: booking._id
  });
};

const sendAdminContactInquiryEmail = async (contactMessage) => {
  const adminEmail = getAdminNotificationEmail();
  const { subject, html, text } = getAdminContactEmail({ contactMessage });
  return sendTransactionalEmail({
    idempotencyKey: `admin-contact:${contactMessage._id}`,
    recipient: adminEmail,
    emailType: 'admin_contact_inquiry',
    subject,
    html,
    text,
    metadata: { contactId: contactMessage._id }
  });
};

module.exports = {
  sendTransactionalEmail,
  sendWelcomeEmail,
  sendBookingCreatedEmail,
  sendBookingConfirmedEmail,
  sendBookingRejectedEmail,
  sendBookingCancelledEmail,
  sendBookingExpiredEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendRefundProcessedEmail,
  sendAdminNewBookingEmail,
  sendAdminContactInquiryEmail
};
