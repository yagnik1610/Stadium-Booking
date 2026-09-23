const crypto = require('crypto');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const SlotLock = require('../models/SlotLock');
const User = require('../models/User');
const PaymentWebhookEvent = require('../models/PaymentWebhookEvent');
const getRazorpayInstance = require('../config/razorpay');
const { createNotification } = require('../utils/notificationHelper');
const { rupeesToPaise, paiseToRupees } = require('../utils/money');
const { logPaymentEvent } = require('../utils/paymentLogger');
const Notification = require('../models/Notification');
const {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendBookingConfirmedEmail,
  sendRefundProcessedEmail
} = require('../utils/emailService');

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'Please provide a booking ID' });
    }

    // Load booking
    const booking = await Booking.findById(bookingId).populate('stadium', 'name city');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to pay for this booking' });
    }

    // Verify booking is eligible for payment
    if (booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'rejected') {
      return res.status(400).json({ success: false, message: `Cannot pay for a ${booking.status} booking` });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(409).json({ success: false, message: 'This booking has already been paid.' });
    }

    // Task 1 Idempotency: If an existing active, usable payment order exists within validity window, reuse it
    const timeoutMinutes = parseInt(process.env.PAYMENT_PENDING_TIMEOUT_MINUTES, 10) || 15;
    const validityThreshold = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const existingUsablePayment = await Payment.findOne({
      booking: booking._id,
      status: { $in: ['created', 'pending'] },
      createdAt: { $gte: validityThreshold }
    }).sort({ createdAt: -1 });

    if (existingUsablePayment && existingUsablePayment.razorpayOrderId) {
      logPaymentEvent('PAYMENT_ORDER_REUSED', {
        bookingId: booking._id,
        razorpayOrderId: existingUsablePayment.razorpayOrderId,
        amount: existingUsablePayment.amount
      });

      return res.status(200).json({
        success: true,
        reused: true,
        payment: {
          paymentId: existingUsablePayment._id,
          bookingId: booking._id,
          razorpayOrderId: existingUsablePayment.razorpayOrderId,
          amount: existingUsablePayment.amount,
          currency: existingUsablePayment.currency,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID
        }
      });
    }

    // Razorpay amount MUST be calculated entirely server-side (in paise)
    const amountInPaise = rupeesToPaise(booking.totalPrice);
    const currency = process.env.RAZORPAY_CURRENCY || 'INR';

    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Payment gateway configuration error' });
    }

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `receipt_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(502).json({ success: false, message: 'Failed to create payment order' });
    }

    // Save payment record
    const payment = await Payment.create({
      user: req.user._id,
      booking: booking._id,
      razorpayOrderId: order.id,
      amount: amountInPaise,
      currency: order.currency,
      status: 'created'
    });

    logPaymentEvent('PAYMENT_ORDER_CREATED', {
      bookingId: booking._id,
      razorpayOrderId: order.id,
      amount: amountInPaise
    });

    res.status(200).json({
      success: true,
      payment: {
        paymentId: payment._id,
        bookingId: booking._id,
        razorpayOrderId: order.id,
        amount: amountInPaise,
        currency: order.currency,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification details' });
    }

    // Find the payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment order not found in our records' });
    }

    // Cross-booking protection: ensure payment belongs to the specified booking if sent
    if (bookingId && payment.booking.toString() !== bookingId.toString()) {
      return res.status(400).json({ success: false, message: 'Payment order does not match the specified booking' });
    }

    // Verify ownership
    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to verify this payment' });
    }

    // Task 2 Idempotency: If already verified with same payment ID, return idempotent success
    if (payment.status === 'paid') {
      if (payment.razorpayPaymentId === razorpay_payment_id) {
        const booking = await Booking.findById(payment.booking);
        return res.status(200).json({
          success: true,
          alreadyProcessed: true,
          message: 'Payment was already verified.',
          payment,
          booking
        });
      }
      return res.status(409).json({ success: false, message: 'Booking has already been paid with another transaction' });
    }

    // Verify Signature using HMAC SHA256
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: 'Payment verification secret missing' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuf = Buffer.from(generatedSignature);
    const receivedBuf = Buffer.from(razorpay_signature);

    const isMatch = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isMatch) {
      if (payment.canTransitionTo('failed')) {
        payment.status = 'failed';
        payment.failureReason = 'Signature mismatch';
        await payment.save();
      }
      logPaymentEvent('PAYMENT_FAILED', {
        razorpayOrderId: razorpay_order_id,
        reason: 'Signature mismatch'
      });
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Signature verified, mark payment as paid
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidAt = new Date();
    await payment.save();

    // Mark booking as paid (Step 12 & Step 15)
    const booking = await Booking.findById(payment.booking).populate('stadium');
    if (booking) {
      booking.paymentStatus = 'paid';
      booking.paymentId = payment._id;
      if (booking.status === 'pending') {
        booking.status = 'confirmed';
      } else if (booking.status === 'cancelled' && (booking.notes?.includes('timeout') || booking.notes?.includes('expired'))) {
        // Expiration race condition recovery: attempt to re-acquire locks
        let lockReacquired = false;
        try {
          await SlotLock.acquireLocks({
            stadiumId: booking.stadium?._id || booking.stadium,
            bookingDate: booking.bookingDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            bookingId: booking._id
          });
          lockReacquired = true;
        } catch (_) {
          lockReacquired = false;
        }

        if (lockReacquired) {
          booking.status = 'confirmed';
          booking.notes = 'Booking re-confirmed upon verified late payment capture';
          logPaymentEvent('BOOKING_RECOVERED_AFTER_EXPIRY_RACE', {
            bookingId: booking._id,
            paymentId: payment._id
          });
        } else {
          booking.notes = 'Payment captured after expiry timeout. Time slot already booked. Administrative refund required.';
          booking.requiresRefund = true;
          logPaymentEvent('PAYMENT_CAPTURED_AFTER_EXPIRY_CONFLICT_REFUND_REQUIRED', {
            bookingId: booking._id,
            paymentId: payment._id
          });
        }
      }
      await booking.save();

      // Side-effect idempotency: Only send notification if one doesn't exist yet for this booking
      const existingNotification = await Notification.findOne({
        user: booking.user,
        booking: booking._id,
        type: 'booking_confirmed'
      });

      if (!existingNotification) {
        const stadiumId = booking.stadium?._id || booking.stadium;
        const stadiumName = booking.stadium?.name || 'stadium';
        await createNotification({
          user: booking.user,
          title: 'Payment Successful',
          message: `Payment of ₹${paiseToRupees(payment.amount)} for your ${stadiumName} booking was successful.`,
          type: 'booking_confirmed',
          booking: booking._id,
          stadium: stadiumId
        });
      }

      // Dispatch payment success and booking confirmed emails asynchronously (failure-safe)
      sendPaymentSuccessEmail(payment, booking, booking.stadium, req.user).catch(() => {});
      sendBookingConfirmedEmail(booking, booking.stadium, req.user, payment).catch(() => {});
    }

    logPaymentEvent('PAYMENT_VERIFIED', {
      bookingId: payment.booking,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: payment.amount
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment,
      booking
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Handle Razorpay Webhooks
// @route   POST /api/payments/webhook
// @access  Public (Authenticated via HMAC signature over raw body)
const handleWebhook = async (req, res, next) => {
  try {
    const rawSignature = req.headers['x-razorpay-signature'];

    if (!rawSignature) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature header' });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || (process.env.NODE_ENV !== 'production' ? 'development_webhook_secret_key' : null);
    if (!webhookSecret) {
      console.error('❌ RAZORPAY_WEBHOOK_SECRET is not configured on server');
      return res.status(500).json({ success: false, message: 'Webhook gateway configuration error' });
    }

    // req.body MUST be raw Buffer here
    const rawBodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBodyBuffer)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature);
    const receivedBuf = Buffer.from(rawSignature);

    const isSignatureValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    // Parse verified payload
    let event;
    try {
      event = JSON.parse(rawBodyBuffer.toString('utf8'));
    } catch (parseErr) {
      return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
    }

    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;
    const refundEntity = event.payload?.refund?.entity;

    const razorpayPaymentId = paymentEntity?.id || refundEntity?.payment_id;
    const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id;

    // Build unique event identifier
    const eventId = req.headers['x-razorpay-event-id'] || event.id || `${eventType}_${razorpayPaymentId || razorpayOrderId}_${event.created_at || Date.now()}`;
    const payloadHash = crypto.createHash('sha256').update(rawBodyBuffer).digest('hex');

    // Deduplication via unique index on eventId
    let webhookRecord;
    try {
      webhookRecord = await PaymentWebhookEvent.create({
        eventId,
        eventType,
        razorpayPaymentId,
        razorpayOrderId,
        payloadHash,
        status: 'processed',
        processed: true,
        processedAt: new Date()
      });
    } catch (err) {
      if (err.code === 11000) {
        logPaymentEvent('PAYMENT_WEBHOOK_DUPLICATE', { eventId, eventType });
        return res.status(200).json({
          success: true,
          alreadyProcessed: true,
          message: 'Webhook event already processed'
        });
      }
      throw err;
    }

    // Supported Event Processing
    switch (eventType) {
      case 'payment.captured':
      case 'order.paid': {
        const orderIdToFind = razorpayOrderId || paymentEntity?.order_id;
        const paymentToFind = razorpayPaymentId || paymentEntity?.id;

        const payment = await Payment.findOne({
          $or: [
            ...(orderIdToFind ? [{ razorpayOrderId: orderIdToFind }] : []),
            ...(paymentToFind ? [{ razorpayPaymentId: paymentToFind }] : [])
          ]
        });

        if (payment) {
          if (payment.canTransitionTo('paid')) {
            payment.status = 'paid';
            payment.razorpayPaymentId = paymentEntity?.id || payment.razorpayPaymentId;
            payment.paidAt = new Date();
            if (paymentEntity?.method) payment.method = paymentEntity.method;
            await payment.save();
          }

          const booking = await Booking.findById(payment.booking).populate('stadium');
          if (booking) {
            booking.paymentStatus = 'paid';
            booking.paymentId = payment._id;
            if (booking.status === 'pending') {
              booking.status = 'confirmed';
            } else if (booking.status === 'cancelled' && (booking.notes?.includes('timeout') || booking.notes?.includes('expired'))) {
              // Expiration race condition recovery: attempt to re-acquire locks
              let lockReacquired = false;
              try {
                await SlotLock.acquireLocks({
                  stadiumId: booking.stadium?._id || booking.stadium,
                  bookingDate: booking.bookingDate,
                  startTime: booking.startTime,
                  endTime: booking.endTime,
                  bookingId: booking._id
                });
                lockReacquired = true;
              } catch (_) {
                lockReacquired = false;
              }

              if (lockReacquired) {
                booking.status = 'confirmed';
                booking.notes = 'Booking re-confirmed upon verified late payment capture';
                logPaymentEvent('BOOKING_RECOVERED_AFTER_EXPIRY_RACE', {
                  bookingId: booking._id,
                  paymentId: payment._id
                });
              } else {
                booking.notes = 'Payment captured after expiry timeout. Time slot already booked. Administrative refund required.';
                booking.requiresRefund = true;
                logPaymentEvent('PAYMENT_CAPTURED_AFTER_EXPIRY_CONFLICT_REFUND_REQUIRED', {
                  bookingId: booking._id,
                  paymentId: payment._id
                });
              }
            }
            await booking.save();

            // Side-effect idempotency: notification
            const existingNotification = await Notification.findOne({
              user: booking.user,
              booking: booking._id,
              type: 'booking_confirmed'
            });

            if (!existingNotification) {
              const stadiumId = booking.stadium?._id || booking.stadium;
              const stadiumName = booking.stadium?.name || 'stadium';
              await createNotification({
                user: booking.user,
                title: 'Payment Successful',
                message: `Payment of ₹${paiseToRupees(payment.amount)} for your ${stadiumName} booking was received.`,
                type: 'booking_confirmed',
                booking: booking._id,
                stadium: stadiumId
              });
            }

            // Dispatch payment success and booking confirmed emails (idempotent: no duplicates)
            User.findById(booking.user).then(bookingUser => {
              if (bookingUser) {
                sendPaymentSuccessEmail(payment, booking, booking.stadium, bookingUser).catch(() => {});
                sendBookingConfirmedEmail(booking, booking.stadium, bookingUser, payment).catch(() => {});
              }
            }).catch(() => {});
          }

          logPaymentEvent('PAYMENT_WEBHOOK_CAPTURED', {
            eventId,
            bookingId: payment.booking,
            razorpayOrderId: orderIdToFind,
            razorpayPaymentId: paymentToFind
          });
        }
        break;
      }

      case 'payment.failed': {
        const orderIdToFind = razorpayOrderId || paymentEntity?.order_id;
        const paymentToFind = razorpayPaymentId || paymentEntity?.id;

        const payment = await Payment.findOne({
          $or: [
            ...(orderIdToFind ? [{ razorpayOrderId: orderIdToFind }] : []),
            ...(paymentToFind ? [{ razorpayPaymentId: paymentToFind }] : [])
          ]
        });

        if (payment && payment.status !== 'paid') {
          if (payment.canTransitionTo('failed')) {
            payment.status = 'failed';
            payment.failureReason = paymentEntity?.error_description || 'Payment failed';
            await payment.save();
          }
          // Do NOT cancel the booking or release locks — preserve pending status for user retry
          logPaymentEvent('PAYMENT_FAILED', {
            eventId,
            razorpayOrderId: orderIdToFind,
            reason: payment.failureReason
          });

          // Dispatch payment failed email (idempotent, informative, booking remains pending)
          User.findById(payment.user).then(paymentUser => {
            if (paymentUser) {
              Booking.findById(payment.booking).populate('stadium').then(bDoc => {
                if (bDoc) {
                  sendPaymentFailedEmail(payment, bDoc, bDoc.stadium, paymentUser, payment.failureReason).catch(() => {});
                }
              }).catch(() => {});
            }
          }).catch(() => {});
        }
        break;
      }

      case 'refund.processed': {
        const paymentIdToFind = refundEntity?.payment_id || razorpayPaymentId;
        const payment = await Payment.findOne({ razorpayPaymentId: paymentIdToFind });

        if (payment && payment.canTransitionTo('refunded')) {
          payment.status = 'refunded';
          await payment.save();

          const booking = await Booking.findById(payment.booking);
          if (booking) {
            booking.paymentStatus = 'refunded';
            await booking.save();
          }

          logPaymentEvent('PAYMENT_REFUNDED', {
            eventId,
            paymentId: payment._id,
            razorpayPaymentId: paymentIdToFind
          });

          // Dispatch refund processed email (idempotent)
          User.findById(payment.user).then(paymentUser => {
            if (paymentUser) {
              sendRefundProcessedEmail(payment, booking || { bookingReference: 'Booking' }, null, paymentUser).catch(() => {});
            }
          }).catch(() => {});
        }
        break;
      }

      case 'refund.failed': {
        logPaymentEvent('REFUND_FAILED', {
          eventId,
          razorpayPaymentId
        });
        break;
      }

      default: {
        // Unknown or unsupported legitimate signed event: acknowledge with ignored
        webhookRecord.status = 'ignored';
        await webhookRecord.save();
        return res.status(200).json({
          success: true,
          status: 'ignored',
          message: `Webhook event ${eventType} ignored`
        });
      }
    }

    return res.status(200).json({
      success: true,
      processed: true,
      message: `Webhook event ${eventType} processed successfully`
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's payments
// @route   GET /api/payments/my
// @access  Private
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('booking', 'bookingDate startTime endTime totalPrice status paymentStatus');

    res.status(200).json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment by Booking ID
// @route   GET /api/payments/:bookingId
// @access  Private
const getPaymentByBookingId = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ booking: req.params.bookingId });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found for this booking' });
    }

    if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this payment' });
    }

    res.status(200).json({
      success: true,
      payment: {
        bookingId: payment.booking,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments/admin/all
// @access  Private/Admin
const getAdminAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        select: 'bookingDate startTime endTime',
        populate: {
          path: 'stadium',
          select: 'name city'
        }
      });

    const safePayments = payments.map(p => ({
      _id: p._id,
      user: p.user ? { name: p.user.name, email: p.user.email } : null,
      booking: p.booking ? { 
        bookingDate: p.booking.bookingDate, 
        startTime: p.booking.startTime, 
        endTime: p.booking.endTime,
        stadium: p.booking.stadium ? { name: p.booking.stadium.name, city: p.booking.stadium.city } : null
      } : null,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      paidAt: p.paidAt,
      createdAt: p.createdAt
    }));

    res.status(200).json({
      success: true,
      count: safePayments.length,
      payments: safePayments
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getMyPayments,
  getPaymentByBookingId,
  getAdminAllPayments
};
