const Payroll = require('../models/Payroll');
const PayStub = require('../models/PayStub');
const TimePunch = require('../models/TimePunch');
const User = require('../models/User');
const { createResponse, createErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const emailService = require('../services/emailService');
const pushNotificationService = require('../services/pushNotificationService');
const { PAYROLL_STATUS, PAGINATION_DEFAULTS } = require('../utils/constants');

class PayrollController {
  /**
   * Create and run a new payroll
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async runPayroll(req, res) {
    try {
      const { payPeriodStart, payPeriodEnd, payDate, employeeIds, notes } = req.body;
      const companyId = req.user.company_id;
      const processedBy = req.user.id;

      // Validate pay period
      const startDate = new Date(payPeriodStart);
      const endDate = new Date(payPeriodEnd);
      const paymentDate = new Date(payDate);

      if (endDate <= startDate) {
        return res.status(400).json(createErrorResponse('Pay period end date must be after start date', 'INVALID_DATE_RANGE'));
      }

      if (paymentDate < endDate) {
        return res.status(400).json(createErrorResponse('Pay date cannot be before pay period end date', 'INVALID_PAY_DATE'));
      }

      // Check for overlapping payroll runs
      const overlappingPayroll = await Payroll.checkOverlappingPeriod(companyId, startDate, endDate);
      if (overlappingPayroll) {
        return res.status(409).json(createErrorResponse('Overlapping payroll period detected', 'OVERLAPPING_PAYROLL'));
      }

      // Create payroll run
      const payrollData = {
        companyId,
        payPeriodStart: startDate,
        payPeriodEnd: endDate,
        payDate: paymentDate,
        employeeIds: employeeIds || null,
        processedBy,
        notes
      };

      const payrollRun = await Payroll.create(payrollData);

      logger.info(`Payroll run created: ${payrollRun.id}`, {
        payrollId: payrollRun.id,
        companyId,
        processedBy,
        period: `${payPeriodStart} to ${payPeriodEnd}`
      });

      res.status(201).json(createResponse({ 
        payroll: payrollRun,
        message: 'Payroll run created successfully' 
      }));
    } catch (error) {
      logger.error('Error running payroll:', error);
      res.status(500).json(createErrorResponse('Failed to run payroll', 'SERVER_ERROR'));
    }
  }

  /**
   * Process payroll calculations
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processPayroll(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      // Get payroll run
      const payrollRun = await Payroll.getById(id, companyId);
      if (!payrollRun) {
        return res.status(404).json(createErrorResponse('Payroll run not found', 'PAYROLL_NOT_FOUND'));
      }

      if (payrollRun.status !== PAYROLL_STATUS.PENDING) {
        return res.status(400).json(createErrorResponse('Payroll can only be processed when in pending status', 'INVALID_STATUS'));
      }

      // Process the payroll
      const processedPayroll = await Payroll.process(id);

      // Send notifications to employees
      try {
        const employees = await Payroll.getEmployees(id);
        const notificationPromises = employees.map(async (employee) => {
          // Email notification
          if (employee.email) {
            await emailService.sendPayrollNotification(
              employee.email,
              employee.first_name,
              {
                period: `${payrollRun.pay_period_start} to ${payrollRun.pay_period_end}`,
                grossPay: employee.gross_pay,
                netPay: employee.net_pay,
                startDate: payrollRun.pay_period_start,
                endDate: payrollRun.pay_period_end
              }
            );
          }

          // Push notification
          if (employee.device_tokens?.length > 0) {
            await pushNotificationService.sendPayrollNotification(
              employee.device_tokens,
              {
                id: processedPayroll.id,
                period: `${payrollRun.pay_period_start} to ${payrollRun.pay_period_end}`,
                netPay: employee.net_pay
              }
            );
          }
        });

        await Promise.allSettled(notificationPromises);
      } catch (notificationError) {
        logger.warn('Some payroll notifications failed:', notificationError);
        // Don't fail the request if notifications fail
      }

      logger.info(`Payroll processed: ${id}`, {
        payrollId: id,
        processedBy: req.user.id,
        totalEmployees: processedPayroll.employee_count,
        totalAmount: processedPayroll.total_amount
      });

      res.json(createResponse({ 
        payroll: processedPayroll,
        message: 'Payroll processed successfully' 
      }));
    } catch (error) {
      logger.error('Error processing payroll:', error);
      res.status(500).json(createErrorResponse('Failed to process payroll', 'SERVER_ERROR'));
    }
  }

  /**
   * Get all payroll runs for company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllPayrolls(req, res) {
    try {
      const { page = 1, limit = PAGINATION_DEFAULTS.LIMIT, status, year } = req.query;
      const companyId = req.user.company_id;

      const filters = { companyId, status, year };
      const pagination = { page: parseInt(page), limit: parseInt(limit) };

      const result = await Payroll.getAll(filters, pagination);

      logger.info(`Retrieved ${result.payrolls.length} payroll runs for company ${companyId}`, {
        userId: req.user.id,
        companyId,
        filters,
        pagination
      });

      res.json(createResponse(result));
    } catch (error) {
      logger.error('Error fetching payrolls:', error);
      res.status(500).json(createErrorResponse('Failed to fetch payrolls', 'SERVER_ERROR'));
    }
  }

  /**
   * Get payroll by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPayrollById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const payroll = await Payroll.getById(id, companyId);
      if (!payroll) {
        return res.status(404).json(createErrorResponse('Payroll not found', 'PAYROLL_NOT_FOUND'));
      }

      // Get detailed information including pay stubs
      const payrollDetails = await Payroll.getDetails(id);

      res.json(createResponse({ payroll: payrollDetails }));
    } catch (error) {
      logger.error('Error fetching payroll:', error);
      res.status(500).json(createErrorResponse('Failed to fetch payroll', 'SERVER_ERROR'));
    }
  }

  /**
   * Update payroll status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updatePayrollStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const companyId = req.user.company_id;

      // Validate status
      if (!Object.values(PAYROLL_STATUS).includes(status)) {
        return res.status(400).json(createErrorResponse('Invalid payroll status', 'INVALID_STATUS'));
      }

      const updatedPayroll = await Payroll.updateStatus(id, status, notes, companyId);
      if (!updatedPayroll) {
        return res.status(404).json(createErrorResponse('Payroll not found', 'PAYROLL_NOT_FOUND'));
      }

      logger.info(`Payroll status updated: ${id}`, {
        payrollId: id,
        newStatus: status,
        updatedBy: req.user.id
      });

      res.json(createResponse({ 
        payroll: updatedPayroll,
        message: 'Payroll status updated successfully' 
      }));
    } catch (error) {
      logger.error('Error updating payroll status:', error);
      res.status(500).json(createErrorResponse('Failed to update payroll status', 'SERVER_ERROR'));
    }
  }

  /**
   * Delete payroll (only if in draft/pending status)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deletePayroll(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      // Get payroll to check status
      const payroll = await Payroll.getById(id, companyId);
      if (!payroll) {
        return res.status(404).json(createErrorResponse('Payroll not found', 'PAYROLL_NOT_FOUND'));
      }

      if (![PAYROLL_STATUS.DRAFT, PAYROLL_STATUS.PENDING].includes(payroll.status)) {
        return res.status(400).json(createErrorResponse('Cannot delete processed or completed payroll', 'INVALID_STATUS'));
      }

      await Payroll.delete(id, companyId);

      logger.info(`Payroll deleted: ${id}`, {
        payrollId: id,
        deletedBy: req.user.id
      });

      res.json(createResponse({ message: 'Payroll deleted successfully' }));
    } catch (error) {
      logger.error('Error deleting payroll:', error);
      res.status(500).json(createErrorResponse('Failed to delete payroll', 'SERVER_ERROR'));
    }
  }

  /**
   * Get payroll statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPayrollStats(req, res) {
    try {
      const { year } = req.query;
      const companyId = req.user.company_id;

      const stats = await Payroll.getStats(companyId, year);

      res.json(createResponse({ stats }));
    } catch (error) {
      logger.error('Error fetching payroll stats:', error);
      res.status(500).json(createErrorResponse('Failed to fetch payroll statistics', 'SERVER_ERROR'));
    }
  }

  /**
   * Approve payroll (additional authorization step)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async approvePayroll(req, res) {
    try {
      const { id } = req.params;
      const { approvalNotes } = req.body;
      const companyId = req.user.company_id;
      const approvedBy = req.user.id;

      const approvedPayroll = await Payroll.approve(id, approvedBy, approvalNotes, companyId);
      if (!approvedPayroll) {
        return res.status(404).json(createErrorResponse('Payroll not found', 'PAYROLL_NOT_FOUND'));
      }

      logger.info(`Payroll approved: ${id}`, {
        payrollId: id,
        approvedBy,
        approvalNotes
      });

      res.json(createResponse({ 
        payroll: approvedPayroll,
        message: 'Payroll approved successfully' 
      }));
    } catch (error) {
      logger.error('Error approving payroll:', error);
      res.status(500).json(createErrorResponse('Failed to approve payroll', 'SERVER_ERROR'));
    }
  }

  /**
   * Finalize payroll (mark as completed)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async finalizePayroll(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const finalizedPayroll = await Payroll.finalize(id, companyId);
      if (!finalizedPayroll) {
        return res.status(404).json(createErrorResponse('Payroll not found', 'PAYROLL_NOT_FOUND'));
      }

      logger.info(`Payroll finalized: ${id}`, {
        payrollId: id,
        finalizedBy: req.user.id
      });

      res.json(createResponse({ 
        payroll: finalizedPayroll,
        message: 'Payroll finalized successfully' 
      }));
    } catch (error) {
      logger.error('Error finalizing payroll:', error);
      res.status(500).json(createErrorResponse('Failed to finalize payroll', 'SERVER_ERROR'));
    }
  }

  /**
   * Calculate payroll preview (without saving)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async calculatePayrollPreview(req, res) {
    try {
      const { payPeriodStart, payPeriodEnd, employeeIds } = req.body;
      const companyId = req.user.company_id;

      const preview = await Payroll.calculatePreview(
        companyId,
        new Date(payPeriodStart),
        new Date(payPeriodEnd),
        employeeIds
      );

      res.json(createResponse({ preview }));
    } catch (error) {
      logger.error('Error calculating payroll preview:', error);
      res.status(500).json(createErrorResponse('Failed to calculate payroll preview', 'SERVER_ERROR'));
    }
  }
}

module.exports = new PayrollController();
