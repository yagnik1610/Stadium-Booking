const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail } = require('../utils/emailService');

// Utility function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, mobile, age, gender, country, state, city } = req.body;

    // Simple manual validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password must be valid text strings'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Backend validation for international mobile number
    if (mobile) {
      const cleanMobile = mobile.trim();
      const digitsOnly = cleanMobile.replace(/\D/g, '');
      const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
      if (!phoneRegex.test(cleanMobile) || digitsOnly.length < 7 || digitsOnly.length > 15) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid international phone number (e.g. +91 9876543210 or +1 4155551234)'
        });
      }
    }

    // Backend validation for age
    if (age !== undefined && age !== '') {
      const numAge = Number(age);
      if (isNaN(numAge) || numAge < 5 || numAge > 120) {
        return res.status(400).json({
          success: false,
          message: 'Age must be a valid number between 5 and 120'
        });
      }
    }

    // Backend validation for gender
    if (gender && !['Male', 'Female', 'Other', 'Prefer not to say'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid gender option'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user (password will be hashed in the pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      mobile: mobile ? mobile.trim() : undefined,
      age: age ? Number(age) : undefined,
      gender: gender || undefined,
      country: country ? country.trim() : 'India',
      state: state ? state.trim() : undefined,
      city: city ? city.trim() : undefined
    });

    if (user) {
      // Trigger welcome email asynchronously (failure-safe)
      sendWelcomeEmail(user).catch(err => console.error('Welcome email error:', err.message));

      // Send response without password
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mobile: user.mobile,
          age: user.age,
          gender: user.gender,
          country: user.country,
          state: user.state,
          city: user.city,
          createdAt: user.createdAt
        },
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid user data'
      });
    }
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, loginId, password } = req.body;

    if (email !== undefined && typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Email must be a valid string' });
    }
    if (loginId !== undefined && typeof loginId !== 'string') {
      return res.status(400).json({ success: false, message: 'Login ID must be a valid string' });
    }
    if (typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Password must be a valid string' });
    }

    const rawIdentifier = loginId || email || '';
    const identifier = rawIdentifier.trim();

    // Validate request
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email/login ID and password'
      });
    }

    // Check for user and explicitly select password field since it has select: false in schema
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { email: identifier },
        { loginId: identifier }
      ]
    }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      if (user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user account is deactivated'
        });
      }
      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mobile: user.mobile,
          age: user.age,
          gender: user.gender,
          country: user.country,
          state: user.state,
          city: user.city,
          createdAt: user.createdAt
        },
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
// @access  Private (Requires Token)
const getUserProfile = async (req, res, next) => {
  try {
    // req.user is set by the authMiddleware
    const user = await User.findById(req.user._id);

    if (user) {
      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          mobile: user.mobile,
          age: user.age,
          gender: user.gender,
          country: user.country,
          state: user.state,
          city: user.city,
          createdAt: user.createdAt
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
