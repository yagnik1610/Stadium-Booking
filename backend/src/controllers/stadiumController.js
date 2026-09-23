const { getMongoStatus } = require('../config/db');
const { memoryStore } = require('../config/memoryStore');
const Stadium = require('../models/Stadium');

// @desc    Get all stadiums & turf arenas
// @route   GET /api/stadiums
// @access  Public
const getAllStadiums = async (req, res) => {
  try {
    const { sport, city, type } = req.query;

    if (getMongoStatus()) {
      let filter = {};
      if (sport) filter.sports = { $in: [new RegExp(sport, 'i')] };
      if (city) filter.city = new RegExp(city, 'i');
      if (type) filter.venueType = type;

      const stadiums = await Stadium.find(filter).sort({ rating: -1 });
      return res.json({ success: true, count: stadiums.length, data: stadiums });
    } else {
      let stadiums = memoryStore.getStadiums();
      if (sport) {
        stadiums = stadiums.filter(s => s.sports && s.sports.some(sp => sp.toLowerCase().includes(sport.toLowerCase())));
      }
      if (city) {
        stadiums = stadiums.filter(s => s.city.toLowerCase().includes(city.toLowerCase()));
      }
      if (type) {
        stadiums = stadiums.filter(s => s.venueType.toLowerCase() === type.toLowerCase());
      }
      return res.json({ success: true, count: stadiums.length, data: stadiums });
    }
  } catch (error) {
    console.error('Error fetching stadiums:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stadiums' });
  }
};

// @desc    Get stadium by ID
// @route   GET /api/stadiums/:id
// @access  Public
const getStadiumById = async (req, res) => {
  try {
    const { id } = req.params;
    let stadium;

    if (getMongoStatus()) {
      stadium = await Stadium.findById(id);
    } else {
      stadium = memoryStore.getStadiumById(id);
    }

    if (!stadium) {
      return res.status(404).json({ success: false, message: 'Stadium not found' });
    }

    res.json({ success: true, data: stadium });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching stadium details' });
  }
};

// @desc    Create new stadium
// @route   POST /api/stadiums
// @access  Private/Admin
const createStadium = async (req, res) => {
  try {
    const stadiumData = req.body;

    if (!stadiumData.name || !stadiumData.city || !stadiumData.address) {
      return res.status(400).json({ success: false, message: 'Name, city, and address are required' });
    }

    let created;
    if (getMongoStatus()) {
      created = await Stadium.create(stadiumData);
    } else {
      created = memoryStore.createStadium(stadiumData);
    }

    res.status(201).json({ success: true, data: created, message: 'Stadium added successfully' });
  } catch (error) {
    console.error('Error creating stadium:', error);
    res.status(500).json({ success: false, message: 'Server error creating stadium' });
  }
};

// @desc    Update stadium
// @route   PUT /api/stadiums/:id
// @access  Private/Admin
const updateStadium = async (req, res) => {
  try {
    const { id } = req.params;
    let updated;

    if (getMongoStatus()) {
      updated = await Stadium.findByIdAndUpdate(id, req.body, { new: true });
    } else {
      updated = memoryStore.updateStadium(id, req.body);
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Stadium not found' });
    }

    res.json({ success: true, data: updated, message: 'Stadium updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating stadium' });
  }
};

// @desc    Delete stadium
// @route   DELETE /api/stadiums/:id
// @access  Private/Admin
const deleteStadium = async (req, res) => {
  try {
    const { id } = req.params;
    let deleted;

    if (getMongoStatus()) {
      deleted = await Stadium.findByIdAndDelete(id);
    } else {
      deleted = memoryStore.deleteStadium(id);
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Stadium not found' });
    }

    res.json({ success: true, message: 'Stadium deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting stadium' });
  }
};

module.exports = { getAllStadiums, getStadiumById, createStadium, updateStadium, deleteStadium };
