/**
 * Money and Currency Conversion Utilities for Stadium Booking System
 * Authoritative storage format for payments: Integer Paise (1 INR = 100 Paise)
 */

/**
 * Converts rupees to integer paise avoiding floating point precision errors
 * @param {number|string} rupees - Amount in rupees
 * @returns {number} Integer amount in paise
 */
const rupeesToPaise = (rupees) => {
  const num = Number(rupees);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
};

/**
 * Converts paise to float rupees formatted to 2 decimal places
 * @param {number|string} paise - Amount in paise
 * @returns {number} Amount in rupees
 */
const paiseToRupees = (paise) => {
  const num = Number(paise);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num) / 100;
};

module.exports = {
  rupeesToPaise,
  paiseToRupees
};
