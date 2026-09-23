const mongoose = require('mongoose');

const paymentWebhookEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    index: true
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    index: true
  },
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  payloadHash: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['processed', 'duplicate', 'ignored', 'failed'],
    default: 'processed'
  },
  error: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

paymentWebhookEventSchema.index({ createdAt: -1 });

paymentWebhookEventSchema.statics.verifyAndEnsureIndexes = async function () {
  await this.syncIndexes();
  const indexes = await this.collection.indexes();
  const hasEventIdUnique = indexes.some(idx => idx.key && idx.key.eventId === 1 && idx.unique === true);
  if (!hasEventIdUnique) {
    throw new Error('Critical PaymentWebhookEvent unique index on eventId is missing');
  }
  return true;
};

const PaymentWebhookEvent = mongoose.model('PaymentWebhookEvent', paymentWebhookEventSchema);

module.exports = PaymentWebhookEvent;
