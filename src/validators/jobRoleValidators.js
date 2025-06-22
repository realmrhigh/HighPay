const { body, query, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// Job role creation validation
const validateJobRoleCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Job title is required and must be between 1-100 characters'),
  
  body('hourlyRate')
    .isFloat({ min: 0.01 })
    .withMessage('Hourly rate must be a positive number'),
  
  body('overtimeRate')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Overtime rate must be a positive number'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('benefits')
    .optional()
    .isArray()
    .withMessage('Benefits must be an array'),
  
  body('benefits.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each benefit must be between 1-100 characters'),
  
  handleValidationErrors
];

// Job role update validation
const validateJobRoleUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Job title must be between 1-100 characters'),
  
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Hourly rate must be a positive number'),
  
  body('overtimeRate')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Overtime rate must be a positive number'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('benefits')
    .optional()
    .isArray()
    .withMessage('Benefits must be an array'),
  
  body('benefits.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each benefit must be between 1-100 characters'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  handleValidationErrors
];

// Job role ID parameter validation
const validateJobRoleId = [
  param('id')
    .isUUID()
    .withMessage('Job role ID must be a valid UUID'),
  
  handleValidationErrors
];

// Job role list query validation
const validateJobRoleListQuery = [
  query('active')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('Active filter must be true, false, or all'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateJobRoleCreation,
  validateJobRoleUpdate,
  validateJobRoleId,
  validateJobRoleListQuery
};
