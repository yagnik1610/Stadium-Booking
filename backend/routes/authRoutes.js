const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes (Relaxed in dev/test to allow comprehensive automated testing)
const isDevOrTest = process.env.NODE_ENV !== 'production';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 5000 : 100,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' }
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 5000 : 50,
  message: { success: false, message: 'Too many registration attempts, please try again after 15 minutes' }
});

// @route   POST /api/auth/register
router.post('/register', registerLimiter, registerUser);

// @route   POST /api/auth/login
router.post('/login', loginLimiter, loginUser);

// @route   GET /api/auth/profile
// @desc    Get user profile (Protected route)
router.get('/profile', protect, getUserProfile);

module.exports = router;
