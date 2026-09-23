const express = require('express');
const router = express.Router();
const { getTargetReviews, submitReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/:targetId', getTargetReviews);
router.post('/', protect, submitReview);

module.exports = router;
