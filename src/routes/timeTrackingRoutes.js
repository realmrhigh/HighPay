const express = require('express');
const timeTrackingController = require('../controllers/timeTrackingController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
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
router.use(apiLimiter);

/**
 * @swagger
 * /api/v1/time-tracking/punch:
 *   post:
 *     summary: Create a new time punch (clock in/out)
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [clock_in, clock_out, break_start, break_end]
 *                 description: Type of time punch
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *                   address:
 *                     type: string
 *               notes:
 *                 type: string
 *                 description: Optional notes
 *     responses:
 *       201:
 *         description: Time punch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TimePunch'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/punch',
  authenticateToken,
  validateTimePunchCreation,
  timeTrackingController.createTimePunch
);

/**
 * @swagger
 * /api/v1/time-tracking/today:
 *   get:
 *     summary: Get today's time punches for current user
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's time punches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TimePunch'
 *       401:
 *         description: Unauthorized
 */
router.get('/today',
  authenticateToken,
  timeTrackingController.getTodaysPunches
);

/**
 * @swagger
 * /api/v1/time-tracking/status:
 *   get:
 *     summary: Get current punch status for user (clocked in/out)
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current punch status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [clocked_in, clocked_out, on_break]
 *                 lastPunch:
 *                   $ref: '#/components/schemas/TimePunch'
 *                 totalHoursToday:
 *                   type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/status',
  authenticateToken,
  timeTrackingController.getCurrentStatus
);

/**
 * @swagger
 * /api/v1/time-tracking/history/{id}:
 *   get:
 *     summary: Get time punch history for a user
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for history
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for history
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Time punch history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 punches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimePunch'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
router.get('/history/:id',
  authenticateToken,
  validateUserId,
  validateTimePunchHistoryQuery,
  timeTrackingController.getTimePunchHistory
);

/**
 * @swagger
 * /api/v1/time-tracking/summary/{id}:
 *   get:
 *     summary: Get time punch summary for a user and date range
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for summary
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for summary
 *     responses:
 *       200:
 *         description: Time punch summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalHours:
 *                   type: number
 *                 regularHours:
 *                   type: number
 *                 overtimeHours:
 *                   type: number
 *                 totalDays:
 *                   type: integer
 *                 averageHoursPerDay:
 *                   type: number
 *       403:
 *         description: Access denied
 */
router.get('/summary/:id',
  authenticateToken,
  validateUserId,
  validateTimePunchSummaryQuery,
  timeTrackingController.getTimePunchSummary
);

/**
 * @swagger
 * /api/v1/time-tracking/team-overview:
 *   get:
 *     summary: Get team time tracking overview for a specific date
 *     tags: [Time Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date for team overview (defaults to today)
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: Team overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date:
 *                   type: string
 *                   format: date
 *                 totalEmployees:
 *                   type: integer
 *                 presentEmployees:
 *                   type: integer
 *                 attendanceRate:
 *                   type: number
 *                 employees:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [present, absent, late]
 *                       hoursWorked:
 *                         type: number
 *       403:
 *         description: Access denied - Admin/Manager role required
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
