// Middleware to check if user is an admin
// Important: This must be used AFTER the authMiddleware's `protect` function
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized as an admin'
    });
  }
};

module.exports = { admin };
