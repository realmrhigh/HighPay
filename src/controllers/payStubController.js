const PayStub = require('../models/PayStub');
const User = require('../models/User');
const { createResponse, createErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { PAGINATION_DEFAULTS } = require('../utils/constants');
const pdfService = require('../services/pdfService');
const Company = require('../models/Company');

class PayStubController {
  /**
   * Get all pay stubs for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserPayStubs(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = PAGINATION_DEFAULTS.LIMIT, year } = req.query;
      const requestingUserId = req.user.id;
      const userRole = req.user.role_type;

      // Check permissions: admin/manager can view any user, employee can only view self
      if (userRole === 'employee' && id !== requestingUserId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Verify user exists and belongs to same company
      if (userRole !== 'employee') {
        const targetUser = await User.getById(id, req.user.company_id);
        if (!targetUser) {
          return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
        }
      }

      const filters = { userId: id, year };
      const pagination = { page: parseInt(page), limit: parseInt(limit) };

      const result = await PayStub.getUserPayStubs(filters, pagination);

      logger.info(`Retrieved ${result.payStubs.length} pay stubs for user ${id}`, {
        requestedBy: requestingUserId,
        targetUserId: id,
        filters,
        pagination
      });

      res.json(createResponse(result));
    } catch (error) {
      logger.error('Error fetching user pay stubs:', error);
      res.status(500).json(createErrorResponse('Failed to fetch pay stubs', 'SERVER_ERROR'));
    }
  }

  /**
   * Get a specific pay stub by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPayStubById(req, res) {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.id;
      const userRole = req.user.role_type;
      const companyId = req.user.company_id;

      const payStub = await PayStub.getById(id);
      if (!payStub) {
        return res.status(404).json(createErrorResponse('Pay stub not found', 'PAYSTUB_NOT_FOUND'));
      }

      // Check permissions
      if (userRole === 'employee' && payStub.user_id !== requestingUserId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Verify pay stub belongs to company
      if (payStub.company_id !== companyId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Get detailed pay stub information
      const payStubDetails = await PayStub.getDetails(id);

      logger.info(`Pay stub ${id} retrieved by ${requestingUserId}`);
      res.json(createResponse({ payStub: payStubDetails }));
    } catch (error) {
      logger.error('Error fetching pay stub:', error);
      res.status(500).json(createErrorResponse('Failed to fetch pay stub', 'SERVER_ERROR'));
    }
  }

  /**
   * Download pay stub as PDF
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async downloadPayStubPDF(req, res) {
    try {
      const { id } = req.params;
      const requestingUserId = req.user.id;
      const userRole = req.user.role_type;
      const companyId = req.user.company_id;

      const payStub = await PayStub.getById(id);
      if (!payStub) {
        return res.status(404).json(createErrorResponse('Pay stub not found', 'PAYSTUB_NOT_FOUND'));
      }

      // Check permissions
      if (userRole === 'employee' && payStub.user_id !== requestingUserId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Verify pay stub belongs to company
      if (payStub.company_id !== companyId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Generate PDF
      const pdfBuffer = await PayStub.generatePDF(id);

      // Set response headers for PDF download
      const filename = `paystub-${payStub.pay_period_start}-${payStub.pay_period_end}-${payStub.user_id}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      logger.info(`Pay stub PDF downloaded: ${id}`, {
        downloadedBy: requestingUserId,
        payStubId: id,
        filename
      });

      res.send(pdfBuffer);
    } catch (error) {
      logger.error('Error downloading pay stub PDF:', error);
      res.status(500).json(createErrorResponse('Failed to download pay stub', 'SERVER_ERROR'));
    }
  }

  /**
   * Generate pay stub PDF
   */
  async generatePayStubPDF(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;

      // Get pay stub data
      const payStub = await PayStub.findById(id);
      if (!payStub) {
        return res.status(404).json({ error: 'Pay stub not found' });
      }

      // Check authorization
      if (userRole !== 'admin' && userRole !== 'manager' && payStub.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get user and company data
      const userData = await User.findById(payStub.userId);
      const companyData = await Company.findById(userData.companyId) || {
        name: 'HighPay Company',
        address: '123 Business St, City, State 12345',
        phone: '(555) 123-4567'
      };

      // Generate PDF
      const pdfBuffer = await pdfService.generatePayStubPDF(payStub, userData, companyData);

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="paystub-${payStub.id}-${Date.now()}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);

      logger.info(`Pay stub PDF generated for user ${userId}, pay stub ${id}`);
    } catch (error) {
      logger.error('Error generating pay stub PDF:', error);
      res.status(500).json({ error: 'Failed to generate pay stub PDF' });
    }
  }

  /**
   * Get company pay stubs with filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCompanyPayStubs(req, res) {
    try {
      const { page = 1, limit = PAGINATION_DEFAULTS.LIMIT, year, userId, payrollId } = req.query;
      const companyId = req.user.company_id;

      const filters = { companyId, year, userId, payrollId };
      const pagination = { page: parseInt(page), limit: parseInt(limit) };

      const result = await PayStub.getCompanyPayStubs(filters, pagination);

      logger.info(`Retrieved ${result.payStubs.length} company pay stubs`, {
        requestedBy: req.user.id,
        companyId,
        filters,
        pagination
      });

      res.json(createResponse(result));
    } catch (error) {
      logger.error('Error fetching company pay stubs:', error);
      res.status(500).json(createErrorResponse('Failed to fetch company pay stubs', 'SERVER_ERROR'));
    }
  }

  /**
   * Update pay stub (admin/manager only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updatePayStub(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const companyId = req.user.company_id;

      // Get existing pay stub
      const existingPayStub = await PayStub.getById(id);
      if (!existingPayStub) {
        return res.status(404).json(createErrorResponse('Pay stub not found', 'PAYSTUB_NOT_FOUND'));
      }

      // Verify pay stub belongs to company
      if (existingPayStub.company_id !== companyId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Check if payroll is finalized (prevent editing finalized pay stubs)
      if (existingPayStub.payroll_status === 'completed') {
        return res.status(400).json(createErrorResponse('Cannot edit pay stub from completed payroll', 'PAYROLL_COMPLETED'));
      }

      const updatedPayStub = await PayStub.update(id, updates);

      logger.info(`Pay stub ${id} updated by ${req.user.id}`, {
        payStubId: id,
        updatedBy: req.user.id,
        updates: Object.keys(updates)
      });

      res.json(createResponse({ 
        payStub: updatedPayStub,
        message: 'Pay stub updated successfully' 
      }));
    } catch (error) {
      logger.error('Error updating pay stub:', error);
      res.status(500).json(createErrorResponse('Failed to update pay stub', 'SERVER_ERROR'));
    }
  }

  /**
   * Delete pay stub (admin only, and only if payroll not completed)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deletePayStub(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      // Get existing pay stub
      const existingPayStub = await PayStub.getById(id);
      if (!existingPayStub) {
        return res.status(404).json(createErrorResponse('Pay stub not found', 'PAYSTUB_NOT_FOUND'));
      }

      // Verify pay stub belongs to company
      if (existingPayStub.company_id !== companyId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Check if payroll is finalized
      if (existingPayStub.payroll_status === 'completed') {
        return res.status(400).json(createErrorResponse('Cannot delete pay stub from completed payroll', 'PAYROLL_COMPLETED'));
      }

      await PayStub.delete(id);

      logger.info(`Pay stub ${id} deleted by ${req.user.id}`, {
        payStubId: id,
        deletedBy: req.user.id,
        userId: existingPayStub.user_id
      });

      res.json(createResponse({ message: 'Pay stub deleted successfully' }));
    } catch (error) {
      logger.error('Error deleting pay stub:', error);
      res.status(500).json(createErrorResponse('Failed to delete pay stub', 'SERVER_ERROR'));
    }
  }

  /**
   * Get pay stub statistics for company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPayStubStats(req, res) {
    try {
      const { year, quarter } = req.query;
      const companyId = req.user.company_id;

      const stats = await PayStub.getStats(companyId, year, quarter);

      res.json(createResponse({ stats }));
    } catch (error) {
      logger.error('Error fetching pay stub stats:', error);
      res.status(500).json(createErrorResponse('Failed to fetch pay stub statistics', 'SERVER_ERROR'));
    }
  }

  /**
   * Regenerate pay stub (admin/manager only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async regeneratePayStub(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const regeneratedPayStub = await PayStub.regenerate(id, companyId);
      if (!regeneratedPayStub) {
        return res.status(404).json(createErrorResponse('Pay stub not found', 'PAYSTUB_NOT_FOUND'));
      }

      logger.info(`Pay stub ${id} regenerated by ${req.user.id}`, {
        payStubId: id,
        regeneratedBy: req.user.id
      });

      res.json(createResponse({ 
        payStub: regeneratedPayStub,
        message: 'Pay stub regenerated successfully' 
      }));
    } catch (error) {
      logger.error('Error regenerating pay stub:', error);
      res.status(500).json(createErrorResponse('Failed to regenerate pay stub', 'SERVER_ERROR'));
    }
  }

  /**
   * Email pay stub to employee
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async emailPayStub(req, res) {
    try {
      const { id } = req.params;
      const { customMessage } = req.body;
      const companyId = req.user.company_id;

      const result = await PayStub.emailToEmployee(id, companyId, customMessage);
      if (!result) {
        return res.status(404).json(createErrorResponse('Pay stub not found', 'PAYSTUB_NOT_FOUND'));
      }

      logger.info(`Pay stub ${id} emailed by ${req.user.id}`, {
        payStubId: id,
        sentBy: req.user.id,
        recipientEmail: result.email
      });

      res.json(createResponse({ 
        message: `Pay stub emailed successfully to ${result.email}` 
      }));
    } catch (error) {
      logger.error('Error emailing pay stub:', error);
      res.status(500).json(createErrorResponse('Failed to email pay stub', 'SERVER_ERROR'));
    }
  }
}

module.exports = new PayStubController();
