const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a password with its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if passwords match
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT token
 * @param {object} payload - Token payload
 * @returns {string} - JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Format validation errors from express-validator
 * @param {object} req - Express request object
 * @returns {array} - Array of formatted error messages
 */
const formatValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
  }
  return [];
};

/**
 * Paginate query results
 * @param {number} page - Current page number
 * @param {number} limit - Number of items per page
 * @returns {object} - Pagination metadata
 */
const getPagination = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items per page
  const offset = (pageNum - 1) * limitNum;
  
  return {
    page: pageNum,
    limit: limitNum,
    offset
  };
};

/**
 * Create pagination response metadata
 * @param {number} totalCount - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination metadata
 */
const createPaginationMeta = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: totalCount,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Sanitize object for logging (remove sensitive data)
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
const sanitizeForLogging = (obj) => {
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];
  const sanitized = { ...obj };
  
  const sanitizeValue = (value, key) => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      return '[REDACTED]';
    }
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map((item, index) => sanitizeValue(item, `${key}[${index}]`));
      } else {
        const sanitizedObj = {};
        Object.keys(value).forEach(subKey => {
          sanitizedObj[subKey] = sanitizeValue(value[subKey], subKey);
        });
        return sanitizedObj;
      }
    }
    
    return value;
  };
  
  Object.keys(sanitized).forEach(key => {
    sanitized[key] = sanitizeValue(sanitized[key], key);
  });
  
  return sanitized;
};

/**
 * Calculate time difference in hours between two timestamps
 * @param {Date} startTime - Start timestamp
 * @param {Date} endTime - End timestamp
 * @returns {number} - Hours difference
 */
const calculateHours = (startTime, endTime) => {
  const diff = new Date(endTime) - new Date(startTime);
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimal places
};

/**
 * Format currency amount
 * @param {number} amount - Amount in cents or dollars
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} - True if valid email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sleep for specified milliseconds (useful for testing)
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after specified time
 */
const sleep = (ms) => {  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create standardized success response
 * @param {object} data - Response data
 * @param {string} message - Optional success message
 * @returns {object} - Standardized response object
 */
const createResponse = (data = {}, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {object} details - Optional error details
 * @returns {object} - Standardized error response object
 */
const createErrorResponse = (message = 'An error occurred', code = 'GENERAL_ERROR', details = null) => {
  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString()
    }
  };

  if (details) {
    errorResponse.error.details = details;
  }

  return errorResponse;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  formatValidationErrors,
  getPagination,
  createPaginationMeta,
  generateRandomString,
  sanitizeForLogging,
  calculateHours,
  formatCurrency,
  isValidEmail,
  sleep,
  createResponse,
  createErrorResponse
};
