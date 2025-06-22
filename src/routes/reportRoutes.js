const express = require('express');
const payStubController = require('../controllers/payStubController');
const payrollController = require('../controllers/payrollController');
const timeTrackingController = require('../controllers/timeTrackingController');
const pdfService = require('../services/pdfService');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply rate limiting to all PDF routes
router.use(apiLimiter);

/**
 * @swagger
 * /api/v1/reports/paystub/{id}/pdf:
 *   get:
 *     summary: Generate pay stub PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Pay stub ID
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Pay stub not found
 *       403:
 *         description: Access denied
 */
router.get('/paystub/:id/pdf',
  authenticateToken,
  payStubController.generatePayStubPDF
);

/**
 * @swagger
 * /api/v1/reports/payroll/{id}/pdf:
 *   get:
 *     summary: Generate payroll report PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Payroll ID
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Payroll not found
 *       403:
 *         description: Access denied - Admin/Manager only
 */
router.get('/payroll/:id/pdf',
  authenticateToken,
  requireRole(['admin', 'manager']),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get payroll data (implement in payroll controller)
      const reportData = await payrollController.getPayrollReportData(id);
      const companyData = {
        name: 'HighPay Company',
        address: '123 Business St, City, State 12345',
        phone: '(555) 123-4567'
      };

      const pdfBuffer = await pdfService.generatePayrollReportPDF(reportData, companyData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payroll-report-${id}-${Date.now()}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate payroll report PDF' });
    }
  }
);

/**
 * @swagger
 * /api/v1/reports/timetracking/{userId}/pdf:
 *   get:
 *     summary: Generate time tracking report PDF
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report
 *     responses:
 *       200:
 *         description: PDF generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid date range
 *       403:
 *         description: Access denied
 */
router.get('/timetracking/:userId/pdf',
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;
      const currentUserId = req.user.userId;
      const userRole = req.user.role;

      // Check authorization
      if (userRole !== 'admin' && userRole !== 'manager' && parseInt(userId) !== currentUserId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get time tracking data (implement in timetracking controller)
      const reportData = await timeTrackingController.getTimeTrackingReportData(userId, startDate, endDate);
      const companyData = {
        name: 'HighPay Company',
        address: '123 Business St, City, State 12345',
        phone: '(555) 123-4567'
      };

      const pdfBuffer = await pdfService.generateTimeTrackingReportPDF(reportData, companyData);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="timetracking-report-${userId}-${Date.now()}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate time tracking report PDF' });
    }
  }
);

/**
 * @swagger
 * /api/v1/reports/websocket/stats:
 *   get:
 *     summary: Get WebSocket connection statistics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WebSocket statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalConnections:
 *                   type: integer
 *                 uniqueUsers:
 *                   type: integer
 *                 activeRooms:
 *                   type: integer
 *                 roomDetails:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/websocket/stats',
  authenticateToken,
  requireRole(['admin']),
  async (req, res) => {
    try {
      const websocketService = require('../services/websocketService');
      const stats = websocketService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get WebSocket statistics' });
    }
  }
);

module.exports = router;
