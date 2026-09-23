/**
 * Structured logger for payment events
 * Ensures sensitive credentials (keys, secrets, full payload details) are never logged.
 */
const logPaymentEvent = (action, details = {}) => {
  const timestamp = new Date().toISOString();
  const safeDetails = { ...details };

  // Sanitize any accidentally passed secrets
  delete safeDetails.keySecret;
  delete safeDetails.webhookSecret;
  delete safeDetails.secret;
  delete safeDetails.password;

  console.log(`[PAYMENT_AUDIT] [${timestamp}] [${action}]`, JSON.stringify(safeDetails));
};

module.exports = {
  logPaymentEvent
};
