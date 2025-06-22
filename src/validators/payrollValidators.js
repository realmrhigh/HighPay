const { body, param, query } = require('express-validator');

/**
 * Validation rules for creating a new payroll
 */
const createPayroll = [
  body('payPeriodStart')
    .isISO8601()
    .withMessage('Pay period start date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const startDate = new Date(value);
      const today = new Date();
      if (startDate > today) {
        throw new Error('Pay period start date cannot be in the future');
      }
      return true;
    }),
  
  body('payPeriodEnd')
    .isISO8601()
    .withMessage('Pay period end date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.payPeriodStart);
      if (endDate <= startDate) {
        throw new Error('Pay period end date must be after start date');
      }
      
      // Check if pay period is reasonable (not more than 1 month)
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 31) {
        throw new Error('Pay period cannot exceed 31 days');
      }
      
      return true;
    }),
  
  body('payDate')
    .isISO8601()
    .withMessage('Pay date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const payDate = new Date(value);
      const endDate = new Date(req.body.payPeriodEnd);
      if (payDate < endDate) {
        throw new Error('Pay date must be on or after pay period end date');
      }
      
      // Check if pay date is not too far in the future (max 30 days from end date)
      const diffTime = Math.abs(payDate - endDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        throw new Error('Pay date cannot be more than 30 days after pay period end');
      }
      
      return true;
    }),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim()
    .escape(),
];

/**
 * Validation rules for updating a payroll
 */
const updatePayroll = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Payroll ID must be a positive integer'),
  
  body('payPeriodStart')
    .optional()
    .isISO8601()
    .withMessage('Pay period start date must be a valid ISO 8601 date'),
  
  body('payPeriodEnd')
    .optional()
    .isISO8601()
    .withMessage('Pay period end date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.payPeriodStart && value) {
        const endDate = new Date(value);
        const startDate = new Date(req.body.payPeriodStart);
        if (endDate <= startDate) {
          throw new Error('Pay period end date must be after start date');
        }
      }
      return true;
    }),
  
  body('payDate')
    .optional()
    .isISO8601()
    .withMessage('Pay date must be a valid ISO 8601 date'),
  
  body('status')
    .optional()
    .isIn(['draft', 'processing', 'completed', 'cancelled'])
    .withMessage('Status must be one of: draft, processing, completed, cancelled'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
    .trim()
    .escape(),
];

/**
 * Validation rules for getting payroll by ID
 */
const getPayrollById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Payroll ID must be a positive integer'),
];

/**
 * Validation rules for payroll list queries
 */
const getPayrolls = [
  query('status')
    .optional()
    .isIn(['draft', 'processing', 'completed', 'cancelled'])
    .withMessage('Status must be one of: draft, processing, completed, cancelled'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'payPeriodStart', 'payPeriodEnd', 'payDate', 'status'])
    .withMessage('SortBy must be one of: createdAt, payPeriodStart, payPeriodEnd, payDate, status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be either asc or desc'),
];

/**
 * Validation rules for payroll processing actions
 */
const payrollAction = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Payroll ID must be a positive integer'),
];

/**
 * Validation rules for bulk payroll operations
 */
const bulkPayrollOperation = [
  body('payrollIds')
    .isArray({ min: 1 })
    .withMessage('Payroll IDs must be a non-empty array')
    .custom((value) => {
      if (!value.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error('All payroll IDs must be positive integers');
      }
      if (value.length > 50) {
        throw new Error('Cannot process more than 50 payrolls at once');
      }
      return true;
    }),
  
  body('action')
    .isIn(['process', 'complete', 'cancel'])
    .withMessage('Action must be one of: process, complete, cancel'),
];

/**
 * Validation rules for payroll date range queries
 */
const payrollDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.startDate && value) {
        const endDate = new Date(value);
        const startDate = new Date(req.query.startDate);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
        
        // Limit query range to 2 years
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 730) {
          throw new Error('Date range cannot exceed 2 years');
        }
      }
      return true;
    }),
];

module.exports = {
  createPayroll,
  updatePayroll,
  getPayrollById,
  getPayrolls,
  payrollAction,
  bulkPayrollOperation,
  payrollDateRange,
};
