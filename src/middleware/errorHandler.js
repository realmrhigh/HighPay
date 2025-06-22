const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');
const { sanitizeForLogging } = require('../utils/helpers');

/**
 * Global error handling middleware
 * Should be placed after all routes and other middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with request context
  logger.logError(err, req);

  // Default error response
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode = ERROR_CODES.INTERNAL_ERROR;
  let message = 'An unexpected error occurred.';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.VALIDATION_FAILED;
    message = 'Validation failed.';
    details = err.details || err.message;
  } 
  else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODES.TOKEN_INVALID;
    message = 'Invalid authentication token.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorCode = ERROR_CODES.TOKEN_EXPIRED;
    message = 'Authentication token has expired.';
  }
  else if (err.code === '23505') { // PostgreSQL unique constraint violation
    statusCode = HTTP_STATUS.CONFLICT;
    errorCode = ERROR_CODES.DUPLICATE_ENTRY;
    message = 'A record with this information already exists.';
  }
  else if (err.code === '23503') { // PostgreSQL foreign key violation
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.FOREIGN_KEY_VIOLATION;
    message = 'Referenced record does not exist.';
  }
  else if (err.code === '23502') { // PostgreSQL not null violation
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.REQUIRED_FIELD_MISSING;
    message = 'Required field is missing.';
  }
  else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.INVALID_FORMAT;
    message = 'Invalid data format provided.';
  }
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = ERROR_CODES.VALIDATION_FAILED;
    message = 'File size exceeds the allowed limit.';
  }
  else if (err.code === 'ENOENT') {
    statusCode = HTTP_STATUS.NOT_FOUND;
    errorCode = ERROR_CODES.RECORD_NOT_FOUND;
    message = 'Requested resource not found.';
  }
  else if (err.status) {
    // Express/HTTP errors that already have a status
    statusCode = err.status;
    message = err.message || message;
  }

  // In development, include the stack trace
  if (process.env.NODE_ENV === 'development') {
    details = details || {
      stack: err.stack,
      name: err.name,
      code: err.code
    };
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(details && { details })
    }
  });
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: ERROR_CODES.RECORD_NOT_FOUND,
      message: `Route ${req.method} ${req.originalUrl} not found.`
    }
  });
};

/**
 * Async error wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database error handler
 * @param {Error} error - Database error
 * @param {string} operation - Description of the operation that failed
 */
const handleDatabaseError = (error, operation = 'Database operation') => {
  logger.error(`${operation} failed`, {
    error: error.message,
    code: error.code,
    detail: error.detail,
    constraint: error.constraint
  });

  // Map PostgreSQL errors to application errors
  if (error.code === '23505') {
    throw new AppError('A record with this information already exists.', HTTP_STATUS.CONFLICT, ERROR_CODES.DUPLICATE_ENTRY);
  }
  
  if (error.code === '23503') {
    throw new AppError('Referenced record does not exist.', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.FOREIGN_KEY_VIOLATION);
  }
  
  if (error.code === '23502') {
    throw new AppError('Required field is missing.', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.REQUIRED_FIELD_MISSING);
  }

  // Generic database error
  throw new AppError('Database operation failed.', HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR);
};

/**
 * Validation error helper
 * @param {string} message - Error message
 * @param {object} details - Validation details
 */
const validationError = (message, details = null) => {
  throw new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_FAILED, details);
};

/**
 * Not found error helper
 * @param {string} resource - Name of the resource not found
 */
const notFoundError = (resource = 'Resource') => {
  throw new AppError(`${resource} not found.`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.RECORD_NOT_FOUND);
};

/**
 * Unauthorized error helper
 * @param {string} message - Error message
 */
const unauthorizedError = (message = 'Unauthorized access.') => {
  throw new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED_ACCESS);
};

/**
 * Forbidden error helper
 * @param {string} message - Error message
 */
const forbiddenError = (message = 'Access forbidden.') => {
  throw new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.INSUFFICIENT_PERMISSIONS);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  handleDatabaseError,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError
};
