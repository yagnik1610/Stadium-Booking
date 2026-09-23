const Sport = require('../models/Sport');
const { logAdminAction } = require('../utils/auditLogger');

// Default initial sports list if collection is empty
const DEFAULT_SPORTS = [
  {
    name: 'Cricket',
    description: 'Outdoor and turf cricket pitch with professional nets and crease.',
    icon: 'Trophy',
    defaultMinDuration: 2,
    defaultMaxDuration: 4,
    durationIncrement: 1,
    minPlayers: 10,
    maxPlayers: 22,
    teamRequired: true,
    equipmentRentalAvailable: true,
    safetyRules: ['Mandatory batting helmets and cricket pads', 'Spikes prohibited on artificial turf'],
    terms: 'Match overruns beyond scheduled time are strictly prohibited.'
  },
  {
    name: 'Football',
    description: 'FIFA standard turf with floodlights, goalposts, and perimeter netting.',
    icon: 'Activity',
    defaultMinDuration: 1,
    defaultMaxDuration: 3,
    durationIncrement: 1,
    minPlayers: 10,
    maxPlayers: 22,
    teamRequired: true,
    equipmentRentalAvailable: true,
    safetyRules: ['Shin guards recommended', 'Turf shoes or studs with rubber cleats only'],
    terms: 'Sliding tackles near perimeter boundaries are restricted.'
  },
  {
    name: 'Tennis',
    description: 'Synthetic hard court or clay tennis court with professional net.',
    icon: 'CircleDot',
    defaultMinDuration: 1,
    defaultMaxDuration: 2,
    durationIncrement: 1,
    minPlayers: 2,
    maxPlayers: 4,
    teamRequired: false,
    equipmentRentalAvailable: true,
    safetyRules: ['Non-marking tennis shoes only', 'Bring official pressure balls or rent on-site'],
    terms: 'Max 4 active participants on court at any time.'
  },
  {
    name: 'Basketball',
    description: 'Indoor / outdoor regulation hardwood or acrylic basketball court.',
    icon: 'Dribbble',
    defaultMinDuration: 1,
    defaultMaxDuration: 3,
    durationIncrement: 1,
    minPlayers: 4,
    maxPlayers: 10,
    teamRequired: false,
    equipmentRentalAvailable: true,
    safetyRules: ['Non-marking basketball shoes mandatory', 'No hanging from rims or backboards'],
    terms: 'Standard FIBA court rules apply.'
  },
  {
    name: 'Badminton',
    description: 'Synthetic wooden or rubber badminton court with tournament netting.',
    icon: 'Zap',
    defaultMinDuration: 1,
    defaultMaxDuration: 2,
    durationIncrement: 1,
    minPlayers: 2,
    maxPlayers: 4,
    teamRequired: false,
    equipmentRentalAvailable: true,
    safetyRules: ['Gum-sole non-marking badminton shoes required'],
    terms: 'Rackets available at reception desk.'
  },
  {
    name: 'Volleyball',
    description: 'Beach sand or indoor tournament volleyball arena.',
    icon: 'Globe',
    defaultMinDuration: 1,
    defaultMaxDuration: 2,
    durationIncrement: 1,
    minPlayers: 6,
    maxPlayers: 12,
    teamRequired: true,
    equipmentRentalAvailable: true,
    safetyRules: ['Knee pads recommended for competitive matches'],
    terms: 'Net height set to standard 2.43m (men) or 2.24m (women).'
  }
];

// Helper to ensure default sports exist
const ensureDefaultSports = async () => {
  const count = await Sport.countDocuments();
  if (count === 0) {
    await Sport.insertMany(DEFAULT_SPORTS);
  }
};

// @desc    Get all sports
// @route   GET /api/sports
// @access  Public (or Admin with ?all=true)
const getSports = async (req, res, next) => {
  try {
    await ensureDefaultSports();

    const query = {};
    if (req.query.all !== 'true') {
      query.isActive = true;
    }

    if (req.query.search) {
      query.name = new RegExp(req.query.search.trim(), 'i');
    }

    const sports = await Sport.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: sports.length,
      sports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sport by ID
// @route   GET /api/sports/:id
// @access  Public
const getSportById = async (req, res, next) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }
    res.status(200).json({ success: true, sport });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Sport ID' });
    }
    next(error);
  }
};

// @desc    Create new sport
// @route   POST /api/sports
// @access  Private/Admin
const createSport = async (req, res, next) => {
  try {
    const {
      name,
      description,
      icon,
      isActive,
      defaultMinDuration,
      defaultMaxDuration,
      durationIncrement,
      minPlayers,
      maxPlayers,
      teamRequired,
      equipmentRentalAvailable,
      safetyRules,
      terms
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a sport name' });
    }

    const existing = await Sport.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A sport with this name already exists' });
    }

    const sport = await Sport.create({
      name: name.trim(),
      description: description?.trim() || '',
      icon: icon?.trim() || 'Trophy',
      isActive: isActive !== false,
      defaultMinDuration: defaultMinDuration ? Number(defaultMinDuration) : 1,
      defaultMaxDuration: defaultMaxDuration ? Number(defaultMaxDuration) : 4,
      durationIncrement: durationIncrement ? Number(durationIncrement) : 1,
      minPlayers: minPlayers ? Number(minPlayers) : 2,
      maxPlayers: maxPlayers ? Number(maxPlayers) : 22,
      teamRequired: Boolean(teamRequired),
      equipmentRentalAvailable: equipmentRentalAvailable !== false,
      safetyRules: Array.isArray(safetyRules) ? safetyRules : (safetyRules ? [safetyRules] : []),
      terms: terms?.trim() || ''
    });

    await logAdminAction(req.user._id, 'SPORT_CREATED', 'Sport', sport._id, `Created sport: ${sport.name}`, req);

    res.status(201).json({
      success: true,
      message: 'Sport created successfully',
      sport
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sport
// @route   PUT /api/sports/:id
// @access  Private/Admin
const updateSport = async (req, res, next) => {
  try {
    let sport = await Sport.findById(req.params.id);
    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }

    // If changing name, ensure uniqueness
    if (req.body.name && req.body.name.trim() !== sport.name) {
      const duplicate = await Sport.findOne({
        _id: { $ne: sport._id },
        name: new RegExp(`^${req.body.name.trim()}$`, 'i')
      });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Another sport with this name already exists' });
      }
    }

    const fieldsToUpdate = [
      'name', 'description', 'icon', 'isActive',
      'defaultMinDuration', 'defaultMaxDuration', 'durationIncrement',
      'minPlayers', 'maxPlayers', 'teamRequired', 'equipmentRentalAvailable',
      'safetyRules', 'terms'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        sport[field] = req.body[field];
      }
    });

    await sport.save();

    await logAdminAction(req.user._id, 'SPORT_UPDATED', 'Sport', sport._id, `Updated sport: ${sport.name}`, req);

    res.status(200).json({
      success: true,
      message: 'Sport updated successfully',
      sport
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Sport ID' });
    }
    next(error);
  }
};

// @desc    Delete or soft deactivate sport
// @route   DELETE /api/sports/:id
// @access  Private/Admin
const deleteSport = async (req, res, next) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (!sport) {
      return res.status(404).json({ success: false, message: 'Sport not found' });
    }

    // Toggle active or delete
    sport.isActive = false;
    await sport.save();

    await logAdminAction(req.user._id, 'SPORT_DEACTIVATED', 'Sport', sport._id, `Deactivated sport: ${sport.name}`, req);

    res.status(200).json({
      success: true,
      message: 'Sport deactivated successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Sport ID' });
    }
    next(error);
  }
};

module.exports = {
  getSports,
  getSportById,
  createSport,
  updateSport,
  deleteSport
};
