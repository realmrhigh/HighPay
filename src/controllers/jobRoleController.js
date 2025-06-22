const JobRole = require('../models/JobRole');
const { createResponse, createErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { PAGINATION_DEFAULTS } = require('../utils/constants');

class JobRoleController {
  /**
   * Get all job roles for a company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllJobRoles(req, res) {
    try {
      const { active = 'true' } = req.query;
      const companyId = req.user.company_id;

      const filters = { companyId, active };
      const jobRoles = await JobRole.getAll(filters);

      logger.info(`Retrieved ${jobRoles.length} job roles for company ${companyId}`, {
        userId: req.user.id,
        companyId,
        filters
      });

      res.json(createResponse({ jobRoles }));
    } catch (error) {
      logger.error('Error fetching job roles:', error);
      res.status(500).json(createErrorResponse('Failed to fetch job roles', 'SERVER_ERROR'));
    }
  }

  /**
   * Get a specific job role by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getJobRoleById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const jobRole = await JobRole.getById(id, companyId);

      if (!jobRole) {
        return res.status(404).json(createErrorResponse('Job role not found', 'JOB_ROLE_NOT_FOUND'));
      }

      logger.info(`Job role ${id} retrieved by ${req.user.id}`);
      res.json(createResponse({ jobRole }));
    } catch (error) {
      logger.error('Error fetching job role:', error);
      res.status(500).json(createErrorResponse('Failed to fetch job role', 'SERVER_ERROR'));
    }
  }

  /**
   * Create a new job role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createJobRole(req, res) {
    try {
      const { title, hourlyRate, overtimeRate, description, benefits } = req.body;
      const companyId = req.user.company_id;

      // Check if job role with same title already exists
      const existingRole = await JobRole.getByTitle(title, companyId);
      if (existingRole) {
        return res.status(409).json(createErrorResponse('A job role with this title already exists', 'JOB_ROLE_EXISTS'));
      }

      const jobRoleData = {
        companyId,
        title,
        hourlyRate,
        overtimeRate: overtimeRate || hourlyRate * 1.5, // Default to 1.5x if not provided
        description,
        benefits
      };

      const newJobRole = await JobRole.create(jobRoleData);

      logger.info(`New job role created: ${newJobRole.id}`, {
        createdBy: req.user.id,
        companyId,
        title: newJobRole.title
      });

      res.status(201).json(createResponse({ jobRole: newJobRole }));
    } catch (error) {
      logger.error('Error creating job role:', error);
      res.status(500).json(createErrorResponse('Failed to create job role', 'SERVER_ERROR'));
    }
  }

  /**
   * Update an existing job role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateJobRole(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      // Verify job role exists and belongs to company
      const existingJobRole = await JobRole.getById(id, companyId);
      if (!existingJobRole) {
        return res.status(404).json(createErrorResponse('Job role not found', 'JOB_ROLE_NOT_FOUND'));
      }

      // If updating title, check for conflicts
      if (req.body.title && req.body.title !== existingJobRole.title) {
        const titleExists = await JobRole.getByTitle(req.body.title, companyId);
        if (titleExists && titleExists.id !== id) {
          return res.status(409).json(createErrorResponse('Job role title already in use', 'TITLE_EXISTS'));
        }
      }

      const updatedJobRole = await JobRole.update(id, req.body);

      logger.info(`Job role ${id} updated by ${req.user.id}`, {
        updates: Object.keys(req.body)
      });

      res.json(createResponse({ jobRole: updatedJobRole }));
    } catch (error) {
      logger.error('Error updating job role:', error);
      res.status(500).json(createErrorResponse('Failed to update job role', 'SERVER_ERROR'));
    }
  }

  /**
   * Delete a job role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteJobRole(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      // Check if job role has active employees
      const employees = await JobRole.getEmployees(id, companyId);
      if (employees.length > 0) {
        return res.status(400).json(createErrorResponse(
          'Cannot delete job role with active employees. Please reassign employees first.',
          'JOB_ROLE_HAS_EMPLOYEES'
        ));
      }

      const deleted = await JobRole.delete(id, companyId);
      if (!deleted) {
        return res.status(404).json(createErrorResponse('Job role not found', 'JOB_ROLE_NOT_FOUND'));
      }

      logger.info(`Job role ${id} deleted by ${req.user.id}`);
      res.json(createResponse({ message: 'Job role deleted successfully' }));
    } catch (error) {
      logger.error('Error deleting job role:', error);
      res.status(500).json(createErrorResponse('Failed to delete job role', 'SERVER_ERROR'));
    }
  }

  /**
   * Archive a job role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async archiveJobRole(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const jobRole = await JobRole.archive(id, companyId);
      if (!jobRole) {
        return res.status(404).json(createErrorResponse('Job role not found', 'JOB_ROLE_NOT_FOUND'));
      }

      logger.info(`Job role ${id} archived by ${req.user.id}`);
      res.json(createResponse({ jobRole, message: 'Job role archived successfully' }));
    } catch (error) {
      logger.error('Error archiving job role:', error);
      res.status(500).json(createErrorResponse('Failed to archive job role', 'SERVER_ERROR'));
    }
  }

  /**
   * Restore an archived job role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async restoreJobRole(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const jobRole = await JobRole.restore(id, companyId);
      if (!jobRole) {
        return res.status(404).json(createErrorResponse('Job role not found', 'JOB_ROLE_NOT_FOUND'));
      }

      logger.info(`Job role ${id} restored by ${req.user.id}`);
      res.json(createResponse({ jobRole, message: 'Job role restored successfully' }));
    } catch (error) {
      logger.error('Error restoring job role:', error);
      res.status(500).json(createErrorResponse('Failed to restore job role', 'SERVER_ERROR'));
    }
  }

  /**
   * Get employees assigned to a job role
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getJobRoleEmployees(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      // Verify job role exists
      const jobRole = await JobRole.getById(id, companyId);
      if (!jobRole) {
        return res.status(404).json(createErrorResponse('Job role not found', 'JOB_ROLE_NOT_FOUND'));
      }

      const employees = await JobRole.getEmployees(id, companyId);

      res.json(createResponse({ 
        jobRole: {
          id: jobRole.id,
          title: jobRole.title
        },
        employees 
      }));
    } catch (error) {
      logger.error('Error fetching job role employees:', error);
      res.status(500).json(createErrorResponse('Failed to fetch job role employees', 'SERVER_ERROR'));
    }
  }

  /**
   * Get job role statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getJobRoleStats(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const stats = await JobRole.getStats(id, companyId);
      if (!stats) {
        return res.status(404).json(createErrorResponse('Job role not found', 'JOB_ROLE_NOT_FOUND'));
      }

      res.json(createResponse({ stats }));
    } catch (error) {
      logger.error('Error fetching job role stats:', error);
      res.status(500).json(createErrorResponse('Failed to fetch job role statistics', 'SERVER_ERROR'));
    }
  }
}

module.exports = new JobRoleController();
