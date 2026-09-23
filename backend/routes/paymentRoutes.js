const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyPayments,
  getPaymentByBookingId,
  getAdminAllPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// All payment routes require authentication
router.use(protect);

// @route   POST /api/payments/create-order
// @desc    Create Razorpay Order
router.post('/create-order', createOrder);

// @route   POST /api/payments/verify
// @desc    Verify Razorpay Payment Signature
router.post('/verify', verifyPayment);

// @route   GET /api/payments/my
// @desc    Get user's payments
router.get('/my', getMyPayments);

// @route   GET /api/payments/admin/all
// @desc    Get all payments (Admin)
// MUST be registered before /:bookingId
router.get('/admin/all', admin, getAdminAllPayments);

// @route   GET /api/payments/:bookingId
// @desc    Get single payment by Booking ID
router.get('/:bookingId', getPaymentByBookingId);

module.exports = router;
