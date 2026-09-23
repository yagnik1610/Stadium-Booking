/**
 * Time and Timezone utilities for Stadium Booking System
 * Platform timezone default: Asia/Kolkata
 */

/**
 * Converts HH:mm time string into minutes from midnight
 * @param {string} timeStr - Time in HH:mm format
 * @returns {number} Minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Converts minutes from midnight back to HH:mm string format
 * @param {number} totalMinutes - Minutes from midnight
 * @returns {string} Time in HH:mm format
 */
const minutesToTime = (totalMinutes) => {
  const mins = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Returns current date string, time string, and time in minutes in platform timezone
 * @param {string} timezone - IANA timezone string (default: Asia/Kolkata)
 * @returns {{ dateStr: string, timeStr: string, timeMinutes: number, hours: number, minutes: number }}
 */
const getPlatformNow = (timezone = 'Asia/Kolkata') => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const dateStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  const rawHour = parseInt(getPart('hour'), 10);
  // Handle edge case where hour 24 could be formatted by some environments
  const hours = rawHour === 24 ? 0 : rawHour;
  const minutes = parseInt(getPart('minute'), 10);
  const timeMinutes = hours * 60 + minutes;
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return { dateStr, timeStr, timeMinutes, hours, minutes };
};

/**
 * Checks if a requested slot date and start time have already passed in the platform timezone
 * @param {string} bookingDate - YYYY-MM-DD
 * @param {string} startTime - HH:mm
 * @param {string} timezone - IANA timezone
 * @returns {boolean} True if slot is in the past
 */
const isPastSlot = (bookingDate, startTime, timezone = 'Asia/Kolkata') => {
  const { dateStr, timeMinutes } = getPlatformNow(timezone);

  if (bookingDate < dateStr) {
    return true;
  }

  if (bookingDate === dateStr) {
    const slotStartMins = timeToMinutes(startTime);
    return slotStartMins <= timeMinutes;
  }

  return false;
};

/**
 * Decomposes a start and end time interval into discrete 1-hour slot tokens
 * Example: '08:00' to '10:00' => ['08:00', '09:00']
 * @param {string} startTime - HH:mm
 * @param {string} endTime - HH:mm
 * @returns {string[]} Array of 1-hour interval start times
 */
const decomposeSlotIntoHours = (startTime, endTime) => {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const hourSlots = [];

  for (let m = startMins; m < endMins; m += 60) {
    hourSlots.push(minutesToTime(m));
  }

  return hourSlots;
};

module.exports = {
  timeToMinutes,
  minutesToTime,
  getPlatformNow,
  isPastSlot,
  decomposeSlotIntoHours
};
