const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { apiLimiter } = require('../middleware/rateLimiter');
const payrollController = require('../controllers/payrollController');
const payrollValidators = require('../validators/payrollValidators');

/**
 * @swagger
 * components:
 *   schemas:
 *     Payroll:
 *       type: object
 *       required:
 *         - companyId
 *         - payPeriodStart
 *         - payPeriodEnd
 *         - payDate
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the payroll
 *         companyId:
 *           type: integer
 *           description: Company ID
 *         payPeriodStart:
 *           type: string
 *           format: date
 *           description: Start date of pay period
 *         payPeriodEnd:
 *           type: string
 *           format: date
 *           description: End date of pay period
 *         payDate:
 *           type: string
 *           format: date
 *           description: Payment date
 *         status:
 *           type: string
 *           enum: [draft, processing, completed, cancelled]
 *           description: Payroll status
 *         totalGrossPay:
 *           type: number
 *           format: decimal
 *           description: Total gross pay amount
 *         totalNetPay:
 *           type: number
 *           format: decimal
 *           description: Total net pay amount
 *         totalDeductions:
 *           type: number
 *           format: decimal
 *           description: Total deductions amount
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Rate limiting for payroll operations
const payrollRateLimit = apiLimiter;

/**
 * @swagger
 * /api/v1/payroll:
 *   get:
 *     summary: Get all payroll runs for company
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, processing, completed, cancelled]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of payroll runs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payroll'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', 
  authenticateToken, 
  requireRole(['admin', 'manager']),
  payrollRateLimit,
  payrollController.getAllPayrolls
);

/**
 * @swagger
 * /api/v1/payroll/{id}:
 *   get:
 *     summary: Get payroll by ID
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 */
router.get('/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  payrollController.getPayrollById
);

/**
 * @swagger
 * /api/v1/payroll:
 *   post:
 *     summary: Create new payroll run
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payPeriodStart
 *               - payPeriodEnd
 *               - payDate
 *             properties:
 *               payPeriodStart:
 *                 type: string
 *                 format: date
 *               payPeriodEnd:
 *                 type: string
 *                 format: date
 *               payDate:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Payroll created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 */
router.post('/',
  authenticateToken,
  requireRole(['admin']),
  payrollRateLimit,
  payrollValidators.createPayroll,
  handleValidationErrors,
  payrollController.runPayroll
);

/**
 * @swagger
 * /api/v1/payroll/{id}:
 *   put:
 *     summary: Update payroll
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payPeriodStart:
 *                 type: string
 *                 format: date
 *               payPeriodEnd:
 *                 type: string
 *                 format: date
 *               payDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [draft, processing, completed, cancelled]
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Payroll updated successfully
 */
router.put('/:id',
  authenticateToken,
  requireRole(['admin']),
  payrollRateLimit,
  payrollValidators.updatePayroll,
  handleValidationErrors,
  payrollController.updatePayrollStatus
);

/**
 * @swagger
 * /api/v1/payroll/{id}/process:
 *   post:
 *     summary: Process payroll (calculate pay stubs)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll processing started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                     estimatedCompletion:
 *                       type: string
 *                       format: date-time
 */
router.post('/:id/process',
  authenticateToken,
  requireRole(['admin']),
  payrollRateLimit,
  payrollController.processPayroll
);

/**
 * @swagger
 * /api/v1/payroll/{id}/complete:
 *   post:
 *     summary: Mark payroll as completed
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll marked as completed
 */
router.post('/:id/complete',
  authenticateToken,
  requireRole(['admin']),
  payrollRateLimit,
  payrollController.finalizePayroll
);

/**
 * @swagger
 * /api/v1/payroll/{id}/cancel:
 *   post:
 *     summary: Cancel payroll
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll cancelled successfully
 */
router.post('/:id/cancel',
  authenticateToken,
  requireRole(['admin']),
  payrollRateLimit,
  payrollController.deletePayroll
);

/**
 * @swagger
 * /api/v1/payroll/{id}/employees:
 *   get:
 *     summary: Get employees included in payroll
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of employees in payroll
 */
router.get('/:id/employees',
  authenticateToken,
  requireRole(['admin', 'manager']),
  payrollController.getPayrollStats
);

module.exports = router;



