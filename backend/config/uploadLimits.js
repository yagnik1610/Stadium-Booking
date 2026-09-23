/**
 * Central Media Upload Limits & Allowed Formats Configuration
 */

const UPLOAD_LIMITS = {
  // 5 MB maximum per single image file
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,

  // Maximum gallery images per stadium venue
  MAX_GALLERY_IMAGES: 8,

  // Permitted image MIME types (Strict: NO svg, html, pdf, exe, zip)
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ],

  // Permitted file extensions
  ALLOWED_EXTENSIONS: [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.avif'
  ]
};

module.exports = UPLOAD_LIMITS;
