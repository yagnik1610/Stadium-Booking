const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  recipient: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  emailType: {
    type: String,
    required: true,
    enum: [
      'welcome',
      'booking_created',
      'booking_confirmed',
      'booking_rejected',
      'booking_cancelled',
      'booking_expired',
      'payment_success',
      'payment_failed',
      'refund_processed',
      'admin_new_booking',
      'admin_contact_inquiry'
    ]
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'failed', 'skipped'],
    default: 'queued'
  },
  provider: {
    type: String,
    default: 'resend'
  },
  providerMessageId: {
    type: String,
    trim: true
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  attemptCount: {
    type: Number,
    default: 1
  },
  lastError: {
    type: String,
    trim: true
  },
  sentAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

emailLogSchema.index({ recipient: 1 });
emailLogSchema.index({ emailType: 1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ createdAt: -1 });

emailLogSchema.statics.verifyAndEnsureIndexes = async function () {
  await this.syncIndexes();
  const indexes = await this.collection.indexes();
  const hasIdempotencyKeyUnique = indexes.some(
    idx => idx.key && idx.key.idempotencyKey === 1 && idx.unique === true
  );
  if (!hasIdempotencyKeyUnique) {
    throw new Error('Critical EmailLog unique index on idempotencyKey is missing');
  }
  return true;
};

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = EmailLog;
