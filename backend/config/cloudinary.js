const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const stream = require('stream');

let mockCloudinaryClient = null;
let isConfiguredInstance = false;

const MOCK_STATE_PATH = path.join(__dirname, '../.mock_cloudinary_active');

/**
 * Injects a mock Cloudinary client for automated unit/integration testing in the same process.
 * @param {Object|null} mockClient
 */
const setMockCloudinaryClient = (mockClient) => {
  mockCloudinaryClient = mockClient;
};

/**
 * Checks whether Cloudinary has complete environment credentials configured.
 * @returns {boolean}
 */
const isCloudinaryConfigured = () => {
  if (mockCloudinaryClient || process.env.MOCK_CLOUDINARY === 'true' || fs.existsSync(MOCK_STATE_PATH)) {
    return true;
  }
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Returns the configured base folder for stadium assets.
 * @returns {string}
 */
const getCloudinaryFolder = () => {
  return process.env.CLOUDINARY_FOLDER || 'stadium-booking';
};

/**
 * Returns the Cloudinary SDK client or mock client.
 * Returns null if not configured and not in test mock mode.
 * @returns {object|null}
 */
const getCloudinaryClient = () => {
  if (mockCloudinaryClient) {
    return mockCloudinaryClient;
  }

  // Cross-process test support (when tests run against the dev server)
  if (process.env.MOCK_CLOUDINARY === 'true' || fs.existsSync(MOCK_STATE_PATH)) {
    return {
      uploader: {
        upload_stream: (options, callback) => {
          let shouldFail = false;
          if (fs.existsSync(MOCK_STATE_PATH)) {
            try {
              const content = fs.readFileSync(MOCK_STATE_PATH, 'utf8');
              const parsed = JSON.parse(content || '{}');
              if (parsed.failUpload) shouldFail = true;
            } catch (_) {}
          }

          const writable = new stream.Writable({
            write(chunk, encoding, nextChunk) {
              nextChunk();
            }
          });

          writable.on('finish', () => {
            if (shouldFail) {
              return callback(new Error('Simulated Cloudinary API upload error or network timeout'));
            }

            const timestamp = Date.now();
            const randomSuffix = Math.floor(Math.random() * 10000);
            const folder = options.folder || 'stadium-booking';
            const publicId = `${folder}/mock_${timestamp}_${randomSuffix}`;
            const format = options.format || 'webp';

            callback(null, {
              public_id: publicId,
              secure_url: `https://res.cloudinary.com/mock-cloud/image/upload/v${timestamp}/${publicId}.${format}`,
              url: `http://res.cloudinary.com/mock-cloud/image/upload/v${timestamp}/${publicId}.${format}`,
              format,
              width: 1200,
              height: 800,
              bytes: 142500,
              resource_type: 'image'
            });
          });

          return writable;
        },
        destroy: async (publicId, options = {}) => {
          let shouldFail = false;
          if (fs.existsSync(MOCK_STATE_PATH)) {
            try {
              const content = fs.readFileSync(MOCK_STATE_PATH, 'utf8');
              const parsed = JSON.parse(content || '{}');
              if (parsed.failDestroy) shouldFail = true;
            } catch (_) {}
          }

          if (shouldFail) {
            throw new Error('Simulated Cloudinary asset deletion error');
          }

          return { result: 'ok' };
        }
      }
    };
  }

  if (!isCloudinaryConfigured()) {
    return null;
  }

  if (!isConfiguredInstance) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
    isConfiguredInstance = true;
  }

  return cloudinary;
};

module.exports = {
  getCloudinaryClient,
  setMockCloudinaryClient,
  isCloudinaryConfigured,
  getCloudinaryFolder
};
