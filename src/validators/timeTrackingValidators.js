const { body, query, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Time punch creation validation
const validateTimePunchCreation = [
  body('type')
    .isIn(['in', 'out'])
    .withMessage('Punch type must be either "in" or "out"'),
  
  body('timestamp')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Timestamp must be a valid ISO 8601 date'),
  
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90 degrees'),
  
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180 degrees'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  
  handleValidationErrors
];

// Time punch update validation
const validateTimePunchUpdate = [
  body('punchTime')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Punch time must be a valid ISO 8601 date'),
  
  body('punchType')
    .optional()
    .isIn(['in', 'out'])
    .withMessage('Punch type must be either "in" or "out"'),
  
  body('locationLat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90 degrees'),
  
  body('locationLng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180 degrees'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  
  handleValidationErrors
];

// Time punch ID parameter validation
const validateTimePunchId = [
  param('id')
    .isUUID()
    .withMessage('Time punch ID must be a valid UUID'),
  
  handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
  param('id')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  handleValidationErrors
];

// Time punch history query validation
const validateTimePunchHistoryQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  // Custom validation to ensure endDate is after startDate
  query('endDate')
    .optional()
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// Time punch summary query validation
const validateTimePunchSummaryQuery = [
  param('id')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  query('startDate')
    .isISO8601()
    .toDate()
    .withMessage('Start date is required and must be a valid ISO 8601 date'),
  
  query('endDate')
    .isISO8601()
    .toDate()
    .withMessage('End date is required and must be a valid ISO 8601 date'),
  
  // Custom validation to ensure date range is reasonable
  query('endDate')
    .custom((endDate, { req }) => {
      const start = new Date(req.query.startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        throw new Error('End date must be after start date');
      }
      
      // Limit to 1 year maximum range
      const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
      if (end.getTime() - start.getTime() > maxRangeMs) {
        throw new Error('Date range cannot exceed 1 year');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

// Team overview query validation
const validateTeamOverviewQuery = [
  query('date')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Date must be a valid ISO 8601 date'),
  
  handleValidationErrors
];

// Export data query validation
const validateExportQuery = [
  query('startDate')
    .isISO8601()
    .toDate()
    .withMessage('Start date is required and must be a valid ISO 8601 date'),
  
  query('endDate')
    .isISO8601()
    .toDate()
    .withMessage('End date is required and must be a valid ISO 8601 date'),
  
  query('userId')
    .optional()
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  query('format')
    .optional()
    .isIn(['csv', 'json', 'xlsx'])
    .withMessage('Format must be csv, json, or xlsx'),
  
  // Custom validation for date range
  query('endDate')
    .custom((endDate, { req }) => {
      const start = new Date(req.query.startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        throw new Error('End date must be after start date');
      }
      
      // Limit export to 6 months maximum
      const maxRangeMs = 180 * 24 * 60 * 60 * 1000; // 6 months in milliseconds
      if (end.getTime() - start.getTime() > maxRangeMs) {
        throw new Error('Export date range cannot exceed 6 months');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateTimePunchCreation,
  validateTimePunchUpdate,
  validateTimePunchId,
  validateUserId,
  validateTimePunchHistoryQuery,
  validateTimePunchSummaryQuery,
  validateTeamOverviewQuery,
  validateExportQuery
};
