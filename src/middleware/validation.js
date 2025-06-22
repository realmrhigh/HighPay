const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES } = require('../utils/constants');

/**
 * Middleware to handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    logger.warn('Validation failed', {
      url: req.originalUrl,
      method: req.method,
      errors: formattedErrors,
      userId: req.user?.id
    });

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Validation failed. Please check your input.',
        details: formattedErrors
      }
    });
  }

  next();
};

/**
 * Custom validation middleware to check if a field is a valid UUID
 * @param {string} fieldName - Name of the field to validate
 * @param {boolean} optional - Whether the field is optional
 */
const validateUUID = (fieldName, optional = false) => {
  return (req, res, next) => {
    const value = req.params[fieldName] || req.body[fieldName] || req.query[fieldName];
    
    if (!value && optional) {
      return next();
    }
    
    if (!value) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.REQUIRED_FIELD_MISSING,
          message: `${fieldName} is required.`
        }
      });
    }

    // Simple UUID v4 validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(value)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_FORMAT,
          message: `${fieldName} must be a valid UUID.`
        }
      });
    }

    next();
  };
};

/**
 * Validate that a numeric ID is a positive integer
 * @param {string} fieldName - Name of the field to validate
 * @param {boolean} optional - Whether the field is optional
 */
const validateNumericId = (fieldName, optional = false) => {
  return (req, res, next) => {
    const value = req.params[fieldName] || req.body[fieldName] || req.query[fieldName];
    
    if (!value && optional) {
      return next();
    }
    
    if (!value) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.REQUIRED_FIELD_MISSING,
          message: `${fieldName} is required.`
        }
      });
    }

    const numericValue = parseInt(value, 10);
    
    if (isNaN(numericValue) || numericValue <= 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_FORMAT,
          message: `${fieldName} must be a positive integer.`
        }
      });
    }

    // Store the parsed value back to the request
    if (req.params[fieldName]) req.params[fieldName] = numericValue;
    if (req.body[fieldName]) req.body[fieldName] = numericValue;
    if (req.query[fieldName]) req.query[fieldName] = numericValue;

    next();
  };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Validate page number
  if (page < 1) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_FORMAT,
        message: 'Page number must be greater than 0.'
      }
    });
  }

  // Validate and limit the limit parameter
  if (limit < 1 || limit > 100) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.INVALID_FORMAT,
        message: 'Limit must be between 1 and 100.'
      }
    });
  }

  // Store validated values
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };

  next();
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} fieldName - Name of the field to validate
 * @param {boolean} optional - Whether the field is optional
 */
const validateDate = (fieldName, optional = false) => {
  return (req, res, next) => {
    const value = req.body[fieldName] || req.query[fieldName];
    
    if (!value && optional) {
      return next();
    }
    
    if (!value) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.REQUIRED_FIELD_MISSING,
          message: `${fieldName} is required.`
        }
      });
    }

    // Validate date format and check if it's a valid date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!dateRegex.test(value)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_FORMAT,
          message: `${fieldName} must be in YYYY-MM-DD format.`
        }
      });
    }

    const date = new Date(value);
    const [year, month, day] = value.split('-').map(Number);
    
    if (date.getFullYear() !== year || 
        date.getMonth() + 1 !== month || 
        date.getDate() !== day) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_FORMAT,
          message: `${fieldName} must be a valid date.`
        }
      });
    }

    next();
  };
};

/**
 * Validate currency amount (positive number with up to 2 decimal places)
 * @param {string} fieldName - Name of the field to validate
 * @param {boolean} optional - Whether the field is optional
 */
const validateCurrency = (fieldName, optional = false) => {
  return (req, res, next) => {
    const value = req.body[fieldName];
    
    if ((value === undefined || value === null) && optional) {
      return next();
    }
    
    if (value === undefined || value === null) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.REQUIRED_FIELD_MISSING,
          message: `${fieldName} is required.`
        }
      });
    }

    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue) || numericValue < 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_FORMAT,
          message: `${fieldName} must be a positive number.`
        }
      });
    }

    // Check for maximum 2 decimal places
    if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_FORMAT,
          message: `${fieldName} can have at most 2 decimal places.`
        }
      });
    }

    // Store the parsed value
    req.body[fieldName] = numericValue;

    next();
  };
};

/**
 * Sanitize string input to prevent XSS attacks
 * @param {Array<string>} fields - Array of field names to sanitize
 */
const sanitizeStrings = (fields) => {
  return (req, res, next) => {
    fields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        // Basic XSS prevention - remove script tags and dangerous attributes
        req.body[field] = req.body[field]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      }
    });
    next();
  };
};

module.exports = {
  handleValidationErrors,
  validateUUID,
  validateNumericId,
  validatePagination,
  validateDate,
  validateCurrency,
  sanitizeStrings
};
