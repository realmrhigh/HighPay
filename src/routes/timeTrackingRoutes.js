const express = require('express');
const timeTrackingController = require('../controllers/timeTrackingController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { applyRateLimit } = require('../middleware/rateLimiter');
const {
  validateTimePunchCreation,
  validateTimePunchUpdate,
  validateTimePunchId,
  validateUserId,
  validateTimePunchHistoryQuery,
  validateTimePunchSummaryQuery,
  validateTeamOverviewQuery,
  validateExportQuery
} = require('../validators/timeTrackingValidators');

const router = express.Router();

// Apply rate limiting to all time tracking routes
router.use(applyRateLimit('timeTracking'));

/**
 * @route   POST /api/v1/time-tracking/punch
 * @desc    Create a new time punch (clock in/out)
 * @access  All authenticated users
 */
router.post('/punch',
  authenticateToken,
  validateTimePunchCreation,
  timeTrackingController.createTimePunch
);

/**
 * @route   GET /api/v1/time-tracking/today
 * @desc    Get today's time punches for current user
 * @access  All authenticated users
 */
router.get('/today',
  authenticateToken,
  timeTrackingController.getTodaysPunches
);

/**
 * @route   GET /api/v1/time-tracking/status
 * @desc    Get current punch status for user (clocked in/out)
 * @access  All authenticated users
 */
router.get('/status',
  authenticateToken,
  timeTrackingController.getCurrentStatus
);

/**
 * @route   GET /api/v1/time-tracking/history/:id
 * @desc    Get time punch history for a user
 * @access  Admin/Manager (any user), Employee (own data only)
 */
router.get('/history/:id',
  authenticateToken,
  validateUserId,
  validateTimePunchHistoryQuery,
  timeTrackingController.getTimePunchHistory
);

/**
 * @route   GET /api/v1/time-tracking/summary/:id
 * @desc    Get time punch summary for a user and date range
 * @access  Admin/Manager (any user), Employee (own data only)
 */
router.get('/summary/:id',
  authenticateToken,
  validateUserId,
  validateTimePunchSummaryQuery,
  timeTrackingController.getTimePunchSummary
);

/**
 * @route   GET /api/v1/time-tracking/team-overview
 * @desc    Get team time tracking overview for a specific date
 * @access  Admin, Manager
 */
router.get('/team-overview',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateTeamOverviewQuery,
  timeTrackingController.getTeamOverview
);

/**
 * @route   PUT /api/v1/time-tracking/punch/:id
 * @desc    Update a time punch
 * @access  Admin, Manager
 */
router.put('/punch/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateTimePunchId,
  validateTimePunchUpdate,
  timeTrackingController.updateTimePunch
);

/**
 * @route   DELETE /api/v1/time-tracking/punch/:id
 * @desc    Delete a time punch
 * @access  Admin, Manager
 */
router.delete('/punch/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateTimePunchId,
  timeTrackingController.deleteTimePunch
);

/**
 * @route   GET /api/v1/time-tracking/export
 * @desc    Export time tracking data for a date range
 * @access  Admin, Manager
 */
router.get('/export',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateExportQuery,
  timeTrackingController.exportTimeData
);

module.exports = router;
