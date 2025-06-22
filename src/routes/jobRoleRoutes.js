const express = require('express');
const jobRoleController = require('../controllers/jobRoleController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { applyRateLimit } = require('../middleware/rateLimiter');
const {
  validateJobRoleCreation,
  validateJobRoleUpdate,
  validateJobRoleId,
  validateJobRoleListQuery
} = require('../validators/jobRoleValidators');

const router = express.Router();

// Apply rate limiting to all job role routes
router.use(applyRateLimit('jobRoles'));

/**
 * @route   GET /api/v1/job-roles
 * @desc    Get all job roles for the company with filtering
 * @access  All authenticated users
 */
router.get('/',
  authenticateToken,
  validateJobRoleListQuery,
  jobRoleController.getAllJobRoles
);

/**
 * @route   POST /api/v1/job-roles
 * @desc    Create a new job role
 * @access  Admin
 */
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  validateJobRoleCreation,
  jobRoleController.createJobRole
);

/**
 * @route   GET /api/v1/job-roles/:id
 * @desc    Get job role by ID
 * @access  All authenticated users
 */
router.get('/:id',
  authenticateToken,
  validateJobRoleId,
  jobRoleController.getJobRoleById
);

/**
 * @route   PUT /api/v1/job-roles/:id
 * @desc    Update job role
 * @access  Admin, Manager
 */
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateJobRoleId,
  validateJobRoleUpdate,
  jobRoleController.updateJobRole
);

/**
 * @route   DELETE /api/v1/job-roles/:id
 * @desc    Delete job role (only if no active employees)
 * @access  Admin
 */
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  validateJobRoleId,
  jobRoleController.deleteJobRole
);

/**
 * @route   PATCH /api/v1/job-roles/:id/archive
 * @desc    Archive job role
 * @access  Admin, Manager
 */
router.patch('/:id/archive',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateJobRoleId,
  jobRoleController.archiveJobRole
);

/**
 * @route   PATCH /api/v1/job-roles/:id/restore
 * @desc    Restore archived job role
 * @access  Admin, Manager
 */
router.patch('/:id/restore',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateJobRoleId,
  jobRoleController.restoreJobRole
);

/**
 * @route   GET /api/v1/job-roles/:id/employees
 * @desc    Get employees assigned to this job role
 * @access  Admin, Manager
 */
router.get('/:id/employees',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateJobRoleId,
  jobRoleController.getJobRoleEmployees
);

/**
 * @route   GET /api/v1/job-roles/:id/stats
 * @desc    Get job role statistics
 * @access  Admin, Manager
 */
router.get('/:id/stats',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateJobRoleId,
  jobRoleController.getJobRoleStats
);

module.exports = router;
