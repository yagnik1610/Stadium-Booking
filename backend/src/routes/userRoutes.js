const express = require('express');
const router = express.Router();
const { updateProfile, getUserMetrics } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.put('/profile', updateProfile);
router.get('/metrics', getUserMetrics);

module.exports = router;
