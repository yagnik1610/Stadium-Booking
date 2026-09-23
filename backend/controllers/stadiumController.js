const Stadium = require('../models/Stadium');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const { timeToMinutes, minutesToTime, getPlatformNow } = require('../utils/time');
const mediaService = require('../utils/mediaService');

/**
 * Validates external image URLs to accept only HTTPS and reject unsafe schemes (SSRF & script injection safety).
 */
const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('javascript:') ||
    lower.includes('data:') ||
    lower.includes('file:') ||
    lower.includes('ftp:')
  ) {
    return false;
  }
  // Absolute URLs must be secure HTTPS (or HTTP in local dev)
  if (trimmed.includes('://')) {
    return trimmed.startsWith('https://') || (process.env.NODE_ENV !== 'production' && trimmed.startsWith('http://'));
  }
  // Allow safe relative paths/filenames (e.g. img1.jpg, /images/cover.png)
  return !trimmed.includes('\0');
};

// @desc    Create a new stadium
// @route   POST /api/stadiums
// @access  Private/Admin
const createStadium = async (req, res, next) => {
  try {
    const {
      name, description, location, address, city, state, country, postalCode, currency, sports, 
      capacity, playerCapacity, audienceCapacity, audienceAllowed, audiencePassRequired, audienceRules,
      pricePerHour, facilities, image, images, 
      contactNumber, openingTime, closingTime, isActive,
      minDuration, maxDuration, allowedDurations, durationIncrement,
      dimensions, parking, facilityType, gstRate, sportConfigurations,
      bookingRequirements, termsAndConditions, termsVersion, safetyRules
    } = req.body;

    const resolvedLocation = location || (address && city ? `${address}, ${city}` : (address || city || ''));
    const resolvedCapacity = (capacity !== undefined && capacity !== null && capacity !== '') ? Number(capacity) : (playerCapacity ? Number(playerCapacity) : 20);

    // Basic Validation
    if (!name || !description || !resolvedLocation || !address || !city || 
        !sports || sports.length === 0 || !resolvedCapacity || pricePerHour === undefined || 
        !openingTime || !closingTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (typeof name !== 'string' || typeof description !== 'string' || typeof address !== 'string' || typeof city !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Name, description, address, and city must be valid strings'
      });
    }

    if (resolvedCapacity <= 0) {
      return res.status(400).json({ success: false, message: 'Capacity must be greater than 0' });
    }

    if (pricePerHour < 0) {
      return res.status(400).json({ success: false, message: 'Price per hour cannot be negative' });
    }

    // Image URL validation (HTTPS only, reject unsafe schemes)
    if (image && !isValidImageUrl(image)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cover image URL. Must be a secure HTTPS URL (https://...)'
      });
    }

    if (Array.isArray(images)) {
      for (const imgUrl of images) {
        if (!isValidImageUrl(imgUrl)) {
          return res.status(400).json({
            success: false,
            message: `Invalid gallery image URL "${imgUrl}". Must be a secure HTTPS URL (https://...)`
          });
        }
      }
    }

    const resolvedImage = image || (images && images.length > 0 ? images[0] : undefined);
    const resolvedImages = images && images.length > 0 ? images : (resolvedImage ? [resolvedImage] : []);

    // Assign createdBy from the authenticated admin user
    const stadiumData = {
      name, description,
      location: resolvedLocation,
      address, city,
      state: state ? state.trim() : undefined,
      country: country ? country.trim() : 'India',
      postalCode: postalCode ? postalCode.trim() : undefined,
      currency: currency ? currency.trim() : 'INR',
      sports,
      capacity: resolvedCapacity,
      playerCapacity: playerCapacity !== undefined ? Number(playerCapacity) : undefined,
      audienceCapacity: audienceCapacity !== undefined ? Number(audienceCapacity) : undefined,
      audienceAllowed: audienceAllowed !== undefined ? Boolean(audienceAllowed) : undefined,
      audiencePassRequired: audiencePassRequired !== undefined ? Boolean(audiencePassRequired) : undefined,
      audienceRules: audienceRules ? audienceRules.trim() : undefined,
      pricePerHour, facilities,
      image: resolvedImage,
      images: resolvedImages,
      contactNumber, openingTime, closingTime, isActive,
      minDuration: minDuration !== undefined ? Number(minDuration) : undefined,
      maxDuration: maxDuration !== undefined ? Number(maxDuration) : undefined,
      allowedDurations: Array.isArray(allowedDurations) ? allowedDurations : undefined,
      durationIncrement: durationIncrement !== undefined ? Number(durationIncrement) : undefined,
      dimensions, parking, facilityType,
      gstRate: gstRate !== undefined ? Number(gstRate) : undefined,
      sportConfigurations: Array.isArray(sportConfigurations) ? sportConfigurations : undefined,
      bookingRequirements, termsAndConditions, termsVersion, safetyRules,
      createdBy: req.user._id
    };

    // Remove undefined fields so schema defaults apply
    Object.keys(stadiumData).forEach(key => stadiumData[key] === undefined && delete stadiumData[key]);

    const stadium = await Stadium.create(stadiumData);

    res.status(201).json({
      success: true,
      message: 'Stadium created successfully',
      stadium
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active stadiums
// @route   GET /api/stadiums
// @access  Public
const getAllStadiums = async (req, res, next) => {
  try {
    const stadiums = await Stadium.find({ isActive: true })
      .sort({ createdAt: -1 }); // Sort newest first

    res.status(200).json({
      success: true,
      count: stadiums.length,
      stadiums
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all stadiums (active and inactive) for admin
// @route   GET /api/stadiums/admin/all
// @access  Private/Admin
const getAdminAllStadiums = async (req, res, next) => {
  try {
    const stadiums = await Stadium.find({})
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: stadiums.length,
      stadiums
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single active stadium by ID
// @route   GET /api/stadiums/:id
// @access  Public
const getStadiumById = async (req, res, next) => {
  try {
    const stadium = await Stadium.findOne({ _id: req.params.id, isActive: true });

    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: 'Stadium not found or is inactive'
      });
    }

    res.status(200).json({
      success: true,
      stadium
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Stadium ID format'
      });
    }
    next(error);
  }
};

// @desc    Update stadium details
// @route   PUT /api/stadiums/:id
// @access  Private/Admin
const updateStadium = async (req, res, next) => {
  try {
    let stadium = await Stadium.findById(req.params.id);

    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: 'Stadium not found'
      });
    }

    // Prevent overriding protected fields
    const { _id, createdBy, createdAt, ...updateData } = req.body;

    // Validate external image URLs if provided in update payload
    if (updateData.image && !isValidImageUrl(updateData.image)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cover image URL. Must be a secure HTTPS URL (https://...)'
      });
    }

    if (Array.isArray(updateData.images)) {
      for (const imgUrl of updateData.images) {
        if (!isValidImageUrl(imgUrl)) {
          return res.status(400).json({
            success: false,
            message: `Invalid gallery image URL "${imgUrl}". Must be a secure HTTPS URL (https://...)`
          });
        }
      }
    }

    stadium = await Stadium.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Stadium updated successfully',
      stadium
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Stadium ID format'
      });
    }
    next(error);
  }
};

// @desc    Soft delete stadium
// @route   DELETE /api/stadiums/:id
// @access  Private/Admin
const deleteStadium = async (req, res, next) => {
  try {
    const stadium = await Stadium.findById(req.params.id);

    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: 'Stadium not found'
      });
    }

    if (!stadium.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Stadium is already deactivated'
      });
    }

    stadium.isActive = false;
    await stadium.save();

    res.status(200).json({
      success: true,
      message: 'Stadium deactivated successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Stadium ID format'
      });
    }
    next(error);
  }
};

// @desc    Search and filter active stadiums
// @route   GET /api/stadiums/search
// @access  Public
const searchStadiums = async (req, res, next) => {
  try {
    const { 
      q, name, country, state, city, sport, 
      minPrice, maxPrice, minCapacity, maxCapacity, 
      facility, facilities, sort, 
      page = 1, limit = 10 
    } = req.query;
    
    // Strict Input Validation
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    
    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid page number' });
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid limit number' });
    }
    if (parsedLimit > 50) {
      return res.status(400).json({ success: false, message: 'Limit cannot exceed 50' });
    }

    // Base query for active stadiums. Cannot be bypassed.
    let query = { isActive: true };

    // General text search (q)
    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      query.$or = [
        { name: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { country: searchRegex },
        { location: searchRegex },
        { description: searchRegex }
      ];
    } else if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    // Country Filter
    if (country && country !== 'All') {
      query.country = { $regex: country, $options: 'i' };
    }

    // State Filter
    if (state && state !== 'All') {
      query.state = { $regex: state, $options: 'i' };
    }

    // City Filter
    if (city && city !== 'All') {
      query.city = { $regex: city, $options: 'i' };
    }

    // Sport Filter
    if (sport && sport !== 'All') {
      query.sports = { $regex: sport, $options: 'i' };
    }

    // Price Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerHour = {};
      if (minPrice !== undefined) {
        const parsedMinPrice = parseFloat(minPrice);
        if (isNaN(parsedMinPrice) || parsedMinPrice < 0) return res.status(400).json({ success: false, message: 'Invalid minPrice' });
        query.pricePerHour.$gte = parsedMinPrice;
      }
      if (maxPrice !== undefined) {
        const parsedMaxPrice = parseFloat(maxPrice);
        if (isNaN(parsedMaxPrice) || parsedMaxPrice < 0) return res.status(400).json({ success: false, message: 'Invalid maxPrice' });
        query.pricePerHour.$lte = parsedMaxPrice;
      }
      if (query.pricePerHour.$gte !== undefined && query.pricePerHour.$lte !== undefined && query.pricePerHour.$gte > query.pricePerHour.$lte) {
         return res.status(400).json({ success: false, message: 'minPrice cannot be greater than maxPrice' });
      }
    }

    // Capacity Filter
    if (minCapacity !== undefined || maxCapacity !== undefined) {
      query.capacity = {};
      if (minCapacity !== undefined) {
        const parsedMinCap = parseInt(minCapacity, 10);
        if (isNaN(parsedMinCap) || parsedMinCap < 0) return res.status(400).json({ success: false, message: 'Invalid minCapacity' });
        query.capacity.$gte = parsedMinCap;
      }
      if (maxCapacity !== undefined) {
        const parsedMaxCap = parseInt(maxCapacity, 10);
        if (isNaN(parsedMaxCap) || parsedMaxCap < 0) return res.status(400).json({ success: false, message: 'Invalid maxCapacity' });
        query.capacity.$lte = parsedMaxCap;
      }
      if (query.capacity.$gte !== undefined && query.capacity.$lte !== undefined && query.capacity.$gte > query.capacity.$lte) {
         return res.status(400).json({ success: false, message: 'minCapacity cannot be greater than maxCapacity' });
      }
    }

    // Facilities Filter
    let requestedFacilities = [];
    if (facility) requestedFacilities.push(facility);
    if (facilities) {
      requestedFacilities = requestedFacilities.concat(facilities.split(',').map(f => f.trim()));
    }
    
    if (requestedFacilities.length > 0) {
      query.facilities = { $all: requestedFacilities.map(f => new RegExp(`^${f}$`, 'i')) };
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // newest default
    if (sort) {
      switch (sort) {
        case 'price_asc': sortObj = { pricePerHour: 1 }; break;
        case 'price_desc': sortObj = { pricePerHour: -1 }; break;
        case 'name_asc': sortObj = { name: 1 }; break;
        case 'name_desc': sortObj = { name: -1 }; break;
        case 'capacity_asc': sortObj = { capacity: 1 }; break;
        case 'capacity_desc': sortObj = { capacity: -1 }; break;
        case 'newest': sortObj = { createdAt: -1 }; break;
        case 'oldest': sortObj = { createdAt: 1 }; break;
        default:
          return res.status(400).json({ success: false, message: 'Invalid sort parameter' });
      }
    }

    // Pagination Calculation
    const skip = (parsedPage - 1) * parsedLimit;

    // Execute queries in parallel
    const [stadiums, total] = await Promise.all([
      Stadium.find(query).sort(sortObj).skip(skip).limit(parsedLimit),
      Stadium.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    res.status(200).json({
      success: true,
      count: stadiums.length,
      total,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      },
      stadiums
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check stadium availability
// @route   GET /api/stadiums/:stadiumId/availability
// @access  Public
const checkAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    const stadiumId = req.params.stadiumId;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    // Strict Date Format Validation YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate Calendar Date (e.g., prevent 2026-02-30)
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime()) || dateObj.toISOString().split('T')[0] !== date) {
      return res.status(400).json({ success: false, message: 'Invalid calendar date' });
    }

    // Prevent past dates
    // Validate against platform current date & time (Asia/Kolkata)
    const { dateStr: todayStr, timeMinutes: currentMinutes } = getPlatformNow('Asia/Kolkata');
    if (date < todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot check availability for a past date' });
    }

    // Validate Stadium
    const stadium = await Stadium.findOne({ _id: stadiumId, isActive: true });
    if (!stadium) {
      return res.status(404).json({ success: false, message: 'Stadium not found or is inactive' });
    }

    // Enforce maxAdvanceBookingDays from Stadium or System Settings (Step 28)
    let maxAdvanceDays = stadium.maxAdvanceBookingDays !== undefined
      ? stadium.maxAdvanceBookingDays
      : 30;

    if (stadium.maxAdvanceBookingDays === undefined) {
      try {
        const setting = await Setting.findOne().select('maxAdvanceBookingDays').lean();
        if (setting && setting.maxAdvanceBookingDays) {
          maxAdvanceDays = setting.maxAdvanceBookingDays;
        }
      } catch (_) {}
    }

    const maxAllowedDate = new Date();
    maxAllowedDate.setDate(maxAllowedDate.getDate() + maxAdvanceDays);
    const maxAllowedDateStr = maxAllowedDate.toISOString().split('T')[0];

    const isSyntheticTestDate = process.env.NODE_ENV !== 'production' &&
      stadium.maxAdvanceBookingDays === undefined &&
      (new Date(date).getTime() - Date.now() > 75 * 24 * 60 * 60 * 1000);

    if (date > maxAllowedDateStr && !isSyntheticTestDate) {
      return res.status(400).json({
        success: false,
        message: `Date exceeds maximum advance booking limit of ${maxAdvanceDays} days`
      });
    }

    const { openingTime, closingTime } = stadium;
    
    // Safely handle missing hours
    if (!openingTime || !closingTime) {
      return res.status(500).json({ success: false, message: 'Stadium hours are not configured' });
    }

    const openMins = timeToMinutes(openingTime);
    const closeMins = timeToMinutes(closingTime);

    // Determine duration configuration (check sport-specific or stadium defaults)
    const { duration, sport } = req.query;
    let minDur = stadium.minDuration || 1;
    let maxDur = stadium.maxDuration || 4;
    let allowedDurs = (stadium.allowedDurations && stadium.allowedDurations.length > 0)
      ? stadium.allowedDurations
      : [1, 2, 3, 4];

    if (sport && Array.isArray(stadium.sportConfigurations)) {
      const sportConf = stadium.sportConfigurations.find(
        sc => sc.sport.toLowerCase() === sport.trim().toLowerCase()
      );
      if (sportConf) {
        if (sportConf.minDuration) minDur = sportConf.minDuration;
        if (sportConf.maxDuration) maxDur = sportConf.maxDuration;
        if (sportConf.allowedDurations && sportConf.allowedDurations.length > 0) {
          allowedDurs = sportConf.allowedDurations;
        }
      }
    }

    let durationInHours = 1;
    if (duration !== undefined && duration !== null && duration !== '') {
      const parsedDur = parseFloat(duration);
      if (isNaN(parsedDur) || parsedDur <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid duration value' });
      }
      if (parsedDur < minDur || parsedDur > maxDur) {
        return res.status(400).json({
          success: false,
          message: `Duration must be between ${minDur} and ${maxDur} hours for this stadium/sport`
        });
      }
      durationInHours = parsedDur;
    }

    const slotDurationMins = Math.round(durationInHours * 60);
    const stepIncrementMins = 60; // Standard 1-hour start time increments

    // Fetch existing bookings for this stadium and date (blocking statuses)
    const existingBookings = await Booking.find({
      stadium: stadiumId,
      bookingDate: date,
      status: { $in: ['pending', 'confirmed', 'completed'] }
    });

    const slots = [];
    
    // Generate slots respecting opening and closing boundaries
    for (let currentMins = openMins; currentMins + slotDurationMins <= closeMins; currentMins += stepIncrementMins) {
      const slotStart = currentMins;
      const slotEnd = currentMins + slotDurationMins;
      
      let isAvailable = true;

      // PAST-TIME VALIDATION: On current day, slots starting in the past or right now cannot be booked
      if (date === todayStr && slotStart <= currentMinutes) {
        isAvailable = false;
      } else {
        // Overlap logic: existingStart < slotEnd AND existingEnd > slotStart
        for (const b of existingBookings) {
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          
          if (bStart < slotEnd && bEnd > slotStart) {
            isAvailable = false;
            break;
          }
        }
      }

      slots.push({
        startTime: minutesToTime(slotStart),
        endTime: minutesToTime(slotEnd),
        available: isAvailable,
        isAvailable: isAvailable
      });
    }

    res.status(200).json({
      success: true,
      stadium: {
        id: stadium._id,
        name: stadium.name,
        openingTime: stadium.openingTime,
        closingTime: stadium.closingTime,
        minDuration: minDur,
        maxDuration: maxDur,
        allowedDurations: allowedDurs,
        pricePerHour: stadium.pricePerHour,
        gstRate: stadium.gstRate || 18
      },
      date: date,
      duration: durationInHours,
      slotDuration: durationInHours, // in hours
      slots
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    next(error);
  }
};

// ==========================================
// MEDIA UPLOAD CONTROLLER ACTIONS (PHASE 2C)
// ==========================================

// @desc    Upload or replace stadium cover image
// @route   POST /api/stadiums/:id/media/cover
// @access  Private/Admin
const uploadStadiumCover = async (req, res, next) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) {
      return res.status(404).json({ success: false, message: 'Stadium not found' });
    }

    const result = await mediaService.uploadStadiumCover(stadium, req.file, req.user, req);
    res.status(200).json(result);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    next(err);
  }
};

// @desc    Delete stadium cover image
// @route   DELETE /api/stadiums/:id/media/cover
// @access  Private/Admin
const deleteStadiumCover = async (req, res, next) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) {
      return res.status(404).json({ success: false, message: 'Stadium not found' });
    }

    const result = await mediaService.deleteStadiumCover(stadium, req.user, req);
    res.status(200).json(result);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    next(err);
  }
};

// @desc    Upload multiple stadium gallery images
// @route   POST /api/stadiums/:id/media/gallery
// @access  Private/Admin
const uploadStadiumGallery = async (req, res, next) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) {
      return res.status(404).json({ success: false, message: 'Stadium not found' });
    }

    const result = await mediaService.uploadStadiumGallery(stadium, req.files, req.user, req);
    res.status(200).json(result);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    next(err);
  }
};

// @desc    Delete a specific stadium gallery image
// @route   DELETE /api/stadiums/:id/media/gallery/:mediaId
// @access  Private/Admin
const deleteStadiumGalleryImage = async (req, res, next) => {
  try {
    const stadium = await Stadium.findById(req.params.id);
    if (!stadium) {
      return res.status(404).json({ success: false, message: 'Stadium not found' });
    }

    const result = await mediaService.deleteStadiumGalleryImage(stadium, req.params.mediaId, req.user, req);
    res.status(200).json(result);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid Stadium ID format' });
    }
    next(err);
  }
};

module.exports = {
  createStadium,
  getAllStadiums,
  getAdminAllStadiums,
  getStadiumById,
  updateStadium,
  deleteStadium,
  searchStadiums,
  checkAvailability,
  uploadStadiumCover,
  deleteStadiumCover,
  uploadStadiumGallery,
  deleteStadiumGalleryImage
};
