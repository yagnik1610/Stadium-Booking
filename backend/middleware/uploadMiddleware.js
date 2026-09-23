const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const UPLOAD_LIMITS = require('../config/uploadLimits');

// Memory storage: files are held in RAM buffers, zero permanent disk writes
const storage = multer.memoryStorage();

/**
 * Validates file extension and MIME type at Multer stream entry.
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  if (!UPLOAD_LIMITS.ALLOWED_EXTENSIONS.includes(ext)) {
    const err = new Error(`Unsupported file extension: ${ext}. Allowed extensions: ${UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(', ')}`);
    err.code = 'UNSUPPORTED_MEDIA_TYPE';
    err.statusCode = 400;
    return cb(err, false);
  }

  if (!UPLOAD_LIMITS.ALLOWED_MIME_TYPES.includes(mime)) {
    const err = new Error(`Unsupported MIME type: ${mime}. Allowed types: ${UPLOAD_LIMITS.ALLOWED_MIME_TYPES.join(', ')}`);
    err.code = 'UNSUPPORTED_MEDIA_TYPE';
    err.statusCode = 400;
    return cb(err, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES
  },
  fileFilter
});

/**
 * Validates the actual binary magic-bytes / file signature of an in-memory buffer.
 * Defends against renamed executables or disguised scripts (e.g., malware.exe -> stadium.jpg).
 * @param {Buffer} buffer
 * @returns {boolean}
 */
const validateImageMagicBytes = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return true;
  }

  // 3. WebP: RIFF....WEBP (RIFF at 0..3 and WEBP at 8..11)
  const riffHeader = buffer.subarray(0, 4).toString('ascii');
  const webpHeader = buffer.subarray(8, 12).toString('ascii');
  if (riffHeader === 'RIFF' && webpHeader === 'WEBP') {
    return true;
  }

  // 4. AVIF: ....ftypavif or ....ftypavis (ftyp at 4..7, avif/avis at 8..11)
  const ftypHeader = buffer.subarray(4, 8).toString('ascii');
  const avifBrand = buffer.subarray(8, 12).toString('ascii');
  if (ftypHeader === 'ftyp' && (avifBrand === 'avif' || avifBrand === 'avis')) {
    return true;
  }

  return false;
};

/**
 * Upload rate limiter: 50 media operations per 15 minutes per IP/admin.
 */
const mediaUploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many media upload requests from this IP/account. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Middleware for single cover image upload.
 */
const uploadCoverMiddleware = (req, res, next) => {
  const singleUploader = upload.single('image');

  singleUploader(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please attach an image under form field "image".'
      });
    }

    if (!validateImageMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'File content does not match allowed image formats. Valid JPEG, PNG, WebP, or AVIF image signature required.'
      });
    }

    next();
  });
};

/**
 * Middleware for multiple gallery images upload.
 */
const uploadGalleryMiddleware = (req, res, next) => {
  const arrayUploader = upload.array('images', UPLOAD_LIMITS.MAX_GALLERY_IMAGES);

  arrayUploader(req, res, (err) => {
    if (err) {
      return next(err);
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No gallery image files provided. Please attach files under form field "images".'
      });
    }

    for (const file of req.files) {
      if (!validateImageMagicBytes(file.buffer)) {
        return res.status(400).json({
          success: false,
          message: `File "${file.originalname}" failed image binary signature validation. Only genuine JPEG, PNG, WebP, or AVIF images are permitted.`
        });
      }
    }

    next();
  });
};

module.exports = {
  uploadCoverMiddleware,
  uploadGalleryMiddleware,
  mediaUploadRateLimiter,
  validateImageMagicBytes
};
