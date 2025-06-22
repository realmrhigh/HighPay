const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { applyRateLimit } = require('../middleware/rateLimiter');
const {
  validateUserCreation,
  validateUserUpdate,
  validateUserId,
  validateUserListQuery,
  validateWorkSummaryQuery
} = require('../validators/userValidators');

const router = express.Router();

// Apply rate limiting to all user routes
router.use(applyRateLimit('users'));

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with pagination, search, and filtering
 * @access  Admin, Manager
 */
router.get('/',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateUserListQuery,
  userController.getAllUsers
);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user
 * @access  Admin
 */
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  validateUserCreation,
  userController.createUser
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Admin/Manager (any user in company), Employee (own profile only)
 */
router.get('/:id',
  authenticateToken,
  validateUserId,
  userController.getUserById
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Admin/Manager (any user in company), Employee (own profile only)
 */
router.put('/:id',
  authenticateToken,
  validateUserId,
  validateUserUpdate,
  userController.updateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Admin
 */
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  validateUserId,
  userController.deleteUser
);

/**
 * @route   PATCH /api/v1/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Admin, Manager
 */
router.patch('/:id/deactivate',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateUserId,
  userController.deactivateUser
);

/**
 * @route   PATCH /api/v1/users/:id/reactivate
 * @desc    Reactivate user
 * @access  Admin, Manager
 */
router.patch('/:id/reactivate',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateUserId,
  userController.reactivateUser
);

/**
 * @route   GET /api/v1/users/:id/work-summary
 * @desc    Get user work summary for a date range
 * @access  Admin/Manager (any user in company), Employee (own data only)
 */
router.get('/:id/work-summary',
  authenticateToken,
  validateWorkSummaryQuery,
  userController.getUserWorkSummary
);

module.exports = router;
