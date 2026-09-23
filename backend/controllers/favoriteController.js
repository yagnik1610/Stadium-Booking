const Favorite = require('../models/Favorite');
const Stadium = require('../models/Stadium');

// @desc    Add a stadium to favorites
// @route   POST /api/favorites
// @access  Private
const addFavorite = async (req, res, next) => {
  try {
    const stadiumId = req.body.stadium || req.body.stadiumId;

    if (!stadiumId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a stadium ID'
      });
    }

    // 1. Validate Stadium
    const stadium = await Stadium.findById(stadiumId);
    
    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: 'Stadium not found'
      });
    }

    if (!stadium.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Stadium not found or is inactive'
      });
    }

    // 2. Prevent Duplicate Favorite (Although MongoDB Index handles this, checking manually provides a clean error easily)
    const existingFavorite = await Favorite.findOne({ user: req.user._id, stadium: stadiumId });
    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: 'Stadium is already in your favorites'
      });
    }

    // 3. Create Favorite
    const favorite = await Favorite.create({
      user: req.user._id,
      stadium: stadiumId
    });

    res.status(201).json({
      success: true,
      message: 'Stadium added to favorites',
      favorite
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    // Fallback for MongoDB duplicate key error code 11000
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Stadium is already in your favorites' });
    }
    next(error);
  }
};

// @desc    Get logged in user's favorites
// @route   GET /api/favorites/my
// @access  Private
const getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('stadium', '_id name description location address city sports capacity pricePerHour facilities images openingTime closingTime isActive')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      favorites
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a stadium from favorites
// @route   DELETE /api/favorites/:stadiumId
// @access  Private
const removeFavorite = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      stadium: req.params.stadiumId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Stadium is not in your favorites'
      });
    }

    await Favorite.deleteOne({ _id: favorite._id });

    res.status(200).json({
      success: true,
      message: 'Stadium removed from favorites'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    next(error);
  }
};

// @desc    Check if a stadium is favorited by the user
// @route   GET /api/favorites/check/:stadiumId
// @access  Private
const checkFavoriteStatus = async (req, res, next) => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user._id,
      stadium: req.params.stadiumId
    });

    res.status(200).json({
      success: true,
      isFavorite: !!favorite
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    next(error);
  }
};

module.exports = {
  addFavorite,
  getMyFavorites,
  removeFavorite,
  checkFavoriteStatus
};
