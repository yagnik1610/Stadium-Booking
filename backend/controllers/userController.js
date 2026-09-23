const User = require('../models/User');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
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

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Validate input
      const { name, email, mobile, age, gender, country, state, city } = req.body;

      // Ensure no attempts to change password, role, or _id through this endpoint
      if (req.body.password || req.body.role || req.body._id || req.body.createdAt || req.body.updatedAt) {
         return res.status(400).json({
             success: false,
             message: 'Cannot update protected fields via this endpoint'
         });
      }

      if (name !== undefined && typeof name !== 'string') {
        return res.status(400).json({ success: false, message: 'Name must be a valid string' });
      }
      if (email !== undefined && typeof email !== 'string') {
        return res.status(400).json({ success: false, message: 'Email must be a valid string' });
      }
      if (mobile !== undefined && typeof mobile !== 'string') {
        return res.status(400).json({ success: false, message: 'Mobile must be a valid string' });
      }
      if (gender !== undefined && typeof gender !== 'string') {
        return res.status(400).json({ success: false, message: 'Gender must be a valid string' });
      }
      if (country !== undefined && typeof country !== 'string') {
        return res.status(400).json({ success: false, message: 'Country must be a valid string' });
      }
      if (state !== undefined && typeof state !== 'string') {
        return res.status(400).json({ success: false, message: 'State must be a valid string' });
      }
      if (city !== undefined && typeof city !== 'string') {
        return res.status(400).json({ success: false, message: 'City must be a valid string' });
      }

      if (name !== undefined) {
        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
          return res.status(400).json({ success: false, message: 'Name cannot be empty' });
        }
        user.name = trimmedName;
      }

      if (mobile !== undefined) {
        if (mobile && mobile.trim() !== '') {
          const cleanMobile = mobile.trim();
          const digitsOnly = cleanMobile.replace(/\D/g, '');
          const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
          if (!phoneRegex.test(cleanMobile) || digitsOnly.length < 7 || digitsOnly.length > 15) {
            return res.status(400).json({
              success: false,
              message: 'Please provide a valid international phone number'
            });
          }
          user.mobile = cleanMobile;
        } else {
          user.mobile = '';
        }
      }

      if (age !== undefined) {
        const numAge = Number(age);
        if (age !== '' && !isNaN(numAge)) {
          if (numAge < 5 || numAge > 120) {
            return res.status(400).json({ success: false, message: 'Age must be between 5 and 120' });
          }
          user.age = numAge;
        } else {
          user.age = undefined;
        }
      }

      if (gender !== undefined) {
        user.gender = gender;
      }

      if (country !== undefined) {
        user.country = country ? country.trim() : 'India';
      }

      if (state !== undefined) {
        user.state = state ? state.trim() : '';
      }

      if (city !== undefined) {
        user.city = city ? city.trim() : '';
      }

      if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();
        // Basic regex for email format
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(normalizedEmail)) {
          return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
        }

        // Check if new email is already taken by someone else (case-insensitive)
        if (normalizedEmail !== user.email.toLowerCase()) {
          const emailExists = await User.findOne({ email: new RegExp('^' + normalizedEmail + '$', 'i') });
          if (emailExists && emailExists._id.toString() !== user._id.toString()) {
            return res.status(400).json({
              success: false,
              message: 'Email is already in use by another account'
            });
          }
        }
        user.email = normalizedEmail;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          mobile: updatedUser.mobile,
          age: updatedUser.age,
          gender: updatedUser.gender,
          country: updatedUser.country,
          state: updatedUser.state,
          city: updatedUser.city,
          createdAt: updatedUser.createdAt
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


// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords'
      });
    }

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Passwords must be valid strings'
      });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'New password must be at least 6 characters long'
        });
    }

    // Must select password field to verify
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save(); // pre('save') hook will hash the new password

    // In a simple architecture, we don't invalidate the existing JWT.
    // The user can continue using the existing token until it expires.
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword
};
