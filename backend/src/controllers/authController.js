const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getMongoStatus } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');
const User = require('../models/User');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_stadium_jwt_key_2026_sports_app', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (getMongoStatus()) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || '',
        role: role === 'admin' ? 'admin' : 'user'
      });

      return res.status(201).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token: generateToken(user._id, user.role)
      });
    } else {
      // Memory Store Fallback
      const userExists = memoryStore.getUserByEmail(email);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists with this email' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = memoryStore.createUser({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || '',
        role: role === 'admin' ? 'admin' : 'user'
      });

      return res.status(201).json({
        success: true,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone
        },
        token: generateToken(newUser._id, newUser.role)
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    let user;
    if (getMongoStatus()) {
      user = await User.findOne({ email: email.toLowerCase() });
    } else {
      user = memoryStore.getUserByEmail(email);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || ''
      },
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

module.exports = { registerUser, loginUser, getMe };
