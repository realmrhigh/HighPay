// User permission roles
const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  EMPLOYEE: 'employee',
  HEAD_MANAGEMENT: 'Head Management' // Legacy support
};

// Time punch types
const PUNCH_TYPES = {
  CLOCK_IN: 'CLOCK_IN',
  CLOCK_OUT: 'CLOCK_OUT',
  LUNCH_START: 'LUNCH_START',
  LUNCH_END: 'LUNCH_END',
  BREAK_START: 'BREAK_START',
  BREAK_END: 'BREAK_END'
};

// Payroll statuses
const PAYROLL_STATUS = {
  DRAFT: 'DRAFT',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// API response status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error codes for API responses
const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Database errors
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  
  // Business logic errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// Default pagination settings
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Time and date constants
const TIME_CONSTANTS = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  
  // Work-related constants
  STANDARD_WORK_HOURS_PER_DAY: 8,
  MEAL_BREAK_THRESHOLD_HOURS: 5,
  OVERTIME_THRESHOLD_HOURS: 40, // Per week
  
  // Time formats
  TIME_FORMAT_24H: 'HH:mm:ss',
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss'
};

// File upload constants
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_MIME_TYPES: {
    PDF: 'application/pdf',
    IMAGE_JPEG: 'image/jpeg',
    IMAGE_PNG: 'image/png',
    CSV: 'text/csv',
    EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  UPLOAD_PATHS: {
    PAY_STUBS: 'uploads/pay-stubs',
    PROFILE_IMAGES: 'uploads/profiles',
    DOCUMENTS: 'uploads/documents',
    TEMP: 'uploads/temp'
  }
};

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  PAYDAY_NOTIFICATION: 'payday-notification',
  MEAL_BREAK_REMINDER: 'meal-break-reminder',
  TIMEOFF_REQUEST: 'timeoff-request'
};

// Push notification types
const NOTIFICATION_TYPES = {
  MEAL_BREAK_REMINDER: 'meal_break_reminder',
  PAYDAY_NOTIFICATION: 'payday_notification',
  TIMEOFF_REQUEST: 'timeoff_request',
  MISSED_CLOCK_IN: 'missed_clock_in',
  SHIFT_REMINDER: 'shift_reminder',
  PAYROLL_COMPLETED: 'payroll_completed'
};

// Database table names
const TABLES = {
  COMPANIES: 'companies',
  USERS: 'users',
  JOB_ROLES: 'jobroles',
  PAYROLLS: 'payrolls',
  PAY_STUBS: 'paystubs',
  TIME_PUNCHES: 'timepunches',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs'
};

// Validation patterns
const VALIDATION_PATTERNS = {
  PASSWORD: /^(?=.*[a-z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  POSTAL_CODE: /^[\d\s\-A-Za-z]{3,10}$/,
  CURRENCY: /^\d+(\.\d{1,2})?$/
};

// Rate limiting
const RATE_LIMITS = {
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 5
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  FILE_UPLOAD: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10
  }
};

// Application modes
const APP_MODES = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging'
};

module.exports = {
  USER_ROLES,
  PUNCH_TYPES,
  PAYROLL_STATUS,
  HTTP_STATUS,
  ERROR_CODES,
  PAGINATION,
  TIME_CONSTANTS,
  FILE_UPLOAD,
  EMAIL_TEMPLATES,
  NOTIFICATION_TYPES,
  TABLES,
  VALIDATION_PATTERNS,
  RATE_LIMITS,
  APP_MODES
};
