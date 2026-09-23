// Error handling middleware

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  // Log error to console only in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Server Error:', err);
  }

  // Mongoose bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with ID: ${err.value}`;
    error = new Error(message);
    error.statusCode = 404; // 400 or 404 depending on how specific endpoints expect it. We'll default to 400 for bad format unless it's a 404 context. Let's use 400 for invalid ID format.
    error.statusCode = 400;
  }

  // Mongoose duplicate key (E11000)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message);
    error.statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  // Handle SyntaxError for malformed JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new Error('Invalid JSON payload');
    error.statusCode = 400;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new Error('File size exceeds the maximum limit of 5 MB');
      error.statusCode = 413;
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = new Error('Too many files uploaded. Maximum 8 gallery images allowed');
      error.statusCode = 400;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new Error(`Unexpected upload form field: ${err.field}. Please use "image" for cover or "images" for gallery.`);
      error.statusCode = 400;
    } else {
      error = new Error(err.message || 'File upload error');
      error.statusCode = 400;
    }
  }

  // Handle custom unsupported media type
  if (err.code === 'UNSUPPORTED_MEDIA_TYPE') {
    error = new Error(err.message);
    error.statusCode = 400;
  }

  // Default error
  const statusCode = error.statusCode || err.status || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message
  });
};

// 404 Handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
