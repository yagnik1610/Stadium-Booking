const { Resend } = require('resend');

let resendInstance = null;
let mockResendClient = null;

/**
 * Injects a mock Resend client for automated testing.
 * @param {Object|null} mockClient - Mock client with emails.send method
 */
const setMockResendClient = (mockClient) => {
  mockResendClient = mockClient;
};

const fs = require('fs');
const path = require('path');

const MOCK_STATE_PATH = path.join(__dirname, '../.mock_resend_active');

/**
 * Returns the configured Resend client instance or null if unconfigured in development.
 * @returns {Resend|Object|null}
 */
const getResendClient = () => {
  if (mockResendClient) {
    return mockResendClient;
  }

  // Cross-process test support (when tests run in separate process from nodemon dev server)
  if (process.env.MOCK_EMAIL === 'true' || fs.existsSync(MOCK_STATE_PATH)) {
    return {
      emails: {
        send: async (options) => {
          let shouldFail = false;
          if (fs.existsSync(MOCK_STATE_PATH)) {
            try {
              const content = fs.readFileSync(MOCK_STATE_PATH, 'utf8');
              const parsed = JSON.parse(content || '{}');
              if (parsed.fail) shouldFail = true;
            } catch (_) {}
          }
          if (shouldFail) {
            return {
              data: null,
              error: { message: 'Resend API rate limit exceeded or network timeout' }
            };
          }
          const messageId = `msg_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
          return {
            data: { id: messageId },
            error: null
          };
        }
      }
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }

  return resendInstance;
};

const getEmailFrom = () => {
  return process.env.EMAIL_FROM || 'Stadium Booking <onboarding@resend.dev>';
};

const getEmailReplyTo = () => {
  return process.env.EMAIL_REPLY_TO || 'support@example.com';
};

const getAdminNotificationEmail = () => {
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@example.com';
};

module.exports = {
  getResendClient,
  setMockResendClient,
  getEmailFrom,
  getEmailReplyTo,
  getAdminNotificationEmail
};
