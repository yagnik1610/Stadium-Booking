const jwt = require('jsonwebtoken');
const { getMongoStatus } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_stadium_jwt_key_2026_sports_app');
    
    if (getMongoStatus()) {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }
      req.user = user;
    } else {
      const user = memoryStore.getUserById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
    }

    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Access denied: Admin privileges required' });
  }
};

module.exports = { protect, admin };
