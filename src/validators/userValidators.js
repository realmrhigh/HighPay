const { body, query, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// User creation validation
const validateUserCreation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be between 1-50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be between 1-50 characters'),
  
  body('roleType')
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role type must be admin, manager, or employee'),
  
  body('jobRoleId')
    .isUUID()
    .withMessage('A valid job role ID is required'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Address must not exceed 255 characters'),
  
  body('hireDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Hire date must be a valid date'),
  
  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1-50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1-50 characters'),
  
  body('roleType')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role type must be admin, manager, or employee'),
  
  body('jobRoleId')
    .optional()
    .isUUID()
    .withMessage('Job role ID must be a valid UUID'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Address must not exceed 255 characters'),
  
  body('hireDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Hire date must be a valid date'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
  param('id')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
  handleValidationErrors
];

// User list query validation
const validateUserListQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must not exceed 100 characters'),
  
  query('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role filter must be admin, manager, or employee'),
  
  handleValidationErrors
];

// Work summary query validation
const validateWorkSummaryQuery = [
  param('id')
    .isUUID()
    .withMessage('User ID must be a valid UUID'),
  
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
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  validateUserCreation,
  validateUserUpdate,
  validateUserId,
  validateUserListQuery,
  validateWorkSummaryQuery,
  validatePasswordChange
};
