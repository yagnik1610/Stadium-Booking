const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  razorpayOrderId: {
    type: String,
    required: true,
  },
  razorpayPaymentId: {
    type: String,
  },
  razorpaySignature: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    required: true,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'pending', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'created'
  },
  method: {
    type: String,
  },
  failureReason: {
    type: String,
  },
  paidAt: {
    type: Date,
  }
}, {
  timestamps: true
});

// State machine allowed transitions
const ALLOWED_TRANSITIONS = {
  created: ['pending', 'paid', 'failed', 'cancelled'],
  pending: ['paid', 'failed', 'cancelled'],
  failed: ['pending', 'cancelled'], // Can retry by creating a new pending order
  paid: ['refunded'],
  cancelled: [],
  refunded: []
};

paymentSchema.methods.canTransitionTo = function (newStatus) {
  if (this.status === newStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[this.status] || [];
  return allowed.includes(newStatus);
};

// Indexes
paymentSchema.index({ booking: 1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ createdAt: -1 });

// Ensure only ONE successful paid payment per booking at database engine level
paymentSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { status: 'paid' }, name: 'booking_single_paid_unique' }
);

// Standard lookup index for razorpayPaymentId (not unique because legacy seed data contains duplicate test payment IDs)
paymentSchema.index({ razorpayPaymentId: 1 });

paymentSchema.statics.verifyAndEnsureIndexes = async function () {
  await this.syncIndexes();
  const indexes = await this.collection.indexes();
  const hasPaidUnique = indexes.some(idx => idx.name === 'booking_single_paid_unique');
  if (!hasPaidUnique) {
    throw new Error('Critical Payment partial unique index booking_single_paid_unique is missing');
  }
  return true;
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
