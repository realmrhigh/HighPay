const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { applyRateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiting to all analytics routes
router.use(applyRateLimit('analytics'));

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsData:
 *       type: object
 *       properties:
 *         timeframe:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *         dateRange:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *         generatedAt:
 *           type: string
 *           format: date-time
 * 
 *     DashboardAnalytics:
 *       allOf:
 *         - $ref: '#/components/schemas/AnalyticsData'
 *         - type: object
 *           properties:
 *             employee:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 active:
 *                   type: integer
 *                 newHires:
 *                   type: integer
 *                 turnoverRate:
 *                   type: number
 *             timeTracking:
 *               type: object
 *               properties:
 *                 totalHours:
 *                   type: number
 *                 averageHoursPerEmployee:
 *                   type: number
 *                 overtimeHours:
 *                   type: number
 *             payroll:
 *               type: object
 *               properties:
 *                 totalGrossPay:
 *                   type: number
 *                 totalNetPay:
 *                   type: number
 *                 averagePayPerEmployee:
 *                   type: number
 */

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *           default: month
 *         description: Timeframe for analytics
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DashboardAnalytics'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - Admin/Manager role required
 */
router.get('/dashboard',
  authenticateToken,
  requireRole(['admin', 'manager']),
  analyticsController.getDashboardAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/employee/{id}:
 *   get:
 *     summary: Get employee-specific analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *           default: month
 *         description: Timeframe for analytics
 *     responses:
 *       200:
 *         description: Employee analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                         department:
 *                           type: string
 *                     time:
 *                       type: object
 *                     payroll:
 *                       type: object
 *                     attendance:
 *                       type: object
 *       403:
 *         description: Access denied
 *       404:
 *         description: Employee not found
 */
router.get('/employee/:id',
  authenticateToken,
  analyticsController.getEmployeeAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/realtime:
 *   get:
 *     summary: Get real-time analytics for live dashboard
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     currentlyWorking:
 *                       type: array
 *                       items:
 *                         type: object
 *                     todayPunches:
 *                       type: object
 *                     recentActivity:
 *                       type: array
 *                     systemHealth:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/realtime',
  authenticateToken,
  requireRole(['admin', 'manager']),
  analyticsController.getRealTimeAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/payroll:
 *   get:
 *     summary: Get payroll analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: year
 *         description: Timeframe for payroll analytics
 *     responses:
 *       200:
 *         description: Payroll analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                     departmentBreakdown:
 *                       type: array
 *                     trends:
 *                       type: object
 *                     costAnalysis:
 *                       type: object
 *       403:
 *         description: Access denied - Admin/Manager role required
 */
router.get('/payroll',
  authenticateToken,
  requireRole(['admin', 'manager']),
  analyticsController.getPayrollAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/attendance:
 *   get:
 *     summary: Get attendance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Timeframe for attendance analytics
 *     responses:
 *       200:
 *         description: Attendance analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                     absenteeism:
 *                       type: object
 *                     punctuality:
 *                       type: object
 *                     patterns:
 *                       type: array
 *       403:
 *         description: Access denied - Admin/Manager role required
 */
router.get('/attendance',
  authenticateToken,
  requireRole(['admin', 'manager']),
  analyticsController.getAttendanceAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/time-tracking:
 *   get:
 *     summary: Get time tracking analytics with trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *           default: month
 *         description: Timeframe for analytics
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Specific user ID for individual analytics
 *     responses:
 *       200:
 *         description: Time tracking analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       403:
 *         description: Access denied
 */
router.get('/time-tracking',
  authenticateToken,
  analyticsController.getTimeTrackingAnalytics
);

/**
 * @swagger
 * /api/v1/analytics/productivity:
 *   get:
 *     summary: Get productivity metrics and insights
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Timeframe for productivity analysis
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: integer
 *         description: Filter by specific department
 *     responses:
 *       200:
 *         description: Productivity metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       type: object
 *                       properties:
 *                         averageProductivityScore:
 *                           type: number
 *                         taskCompletionRate:
 *                           type: number
 *                         efficiencyTrend:
 *                           type: string
 *                         topPerformers:
 *                           type: array
 *                         departmentComparison:
 *                           type: array
 *       403:
 *         description: Access denied - Admin/Manager role required
 */
router.get('/productivity',
  authenticateToken,
  requireRole(['admin', 'manager']),
  analyticsController.getProductivityMetrics
);

/**
 * @swagger
 * /api/v1/analytics/custom-report:
 *   post:
 *     summary: Generate custom analytics report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Report start date
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: Report end date
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [hours, attendance, payroll, productivity]
 *                 description: Metrics to include in report
 *               groupBy:
 *                 type: string
 *                 enum: [day, week, month]
 *                 default: day
 *                 description: How to group the data
 *               filters:
 *                 type: object
 *                 description: Additional filters to apply
 *     responses:
 *       200:
 *         description: Custom report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportId:
 *                       type: string
 *                     data:
 *                       type: object
 *                     insights:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request parameters
 *       403:
 *         description: Access denied - Admin/Manager role required
 */
router.post('/custom-report',
  authenticateToken,
  requireRole(['admin', 'manager']),
  analyticsController.getCustomReport
);

/**
 * @swagger
 * /api/v1/analytics/export:
 *   get:
 *     summary: Export analytics data in various formats
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [dashboard, payroll, attendance, time-tracking]
 *         description: Type of analytics to export
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *           default: month
 *         description: Timeframe for data export
 *     responses:
 *       200:
 *         description: Analytics data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid export parameters
 *       403:
 *         description: Access denied - Admin/Manager role required
 */
router.get('/export',
  authenticateToken,
  requireRole(['admin', 'manager']),
  analyticsController.exportAnalytics
);

module.exports = router;
