const Notification = require('../models/Notification');

/**
 * Helper to safely create a notification without blocking the main process
 * @param {Object} options
 * @param {ObjectId} options.user - The user ID receiving the notification
 * @param {String} options.type - Type of notification (e.g., 'booking_created')
 * @param {String} options.title - Short title
 * @param {String} options.message - Detailed message
 * @param {ObjectId} [options.booking] - Optional booking ID
 * @param {ObjectId} [options.stadium] - Optional stadium ID
 * @returns {Promise<Object|null>} The created notification or null if failed
 */
const createNotification = async ({ user, type, title, message, booking = null, stadium = null }) => {
  try {
    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      booking,
      stadium
    });
    return notification;
  } catch (error) {
    // Log the error but do not throw, to prevent rolling back successful business logic
    console.error('❌ Failed to create notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification
};
