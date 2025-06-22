const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createResponse, createErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { PAGINATION_DEFAULTS } = require('../utils/constants');

class UserController {
  /**
   * Get all users with pagination, search, and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = PAGINATION_DEFAULTS.LIMIT, search = '', role = '' } = req.query;
      const companyId = req.user.company_id;

      const filters = { companyId, search, role };
      const pagination = { page: parseInt(page), limit: parseInt(limit) };

      const result = await User.getAll(filters, pagination);

      logger.info(`Retrieved ${result.users.length} users for company ${companyId}`, {
        userId: req.user.id,
        companyId,
        filters,
        pagination
      });

      res.json(createResponse(result));
    } catch (error) {
      logger.error('Error fetching users:', error);
      res.status(500).json(createErrorResponse('Failed to fetch users', 'SERVER_ERROR'));
    }
  }

  /**
   * Get a specific user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;
      const requestingUserId = req.user.id;
      const userRole = req.user.role_type;

      // Check permissions: admin/manager can view any user in company, employee can only view self
      if (userRole === 'employee' && id !== requestingUserId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      const user = await User.getById(id, companyId);

      if (!user) {
        return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
      }

      logger.info(`User ${id} retrieved by ${requestingUserId}`);
      res.json(createResponse({ user }));
    } catch (error) {
      logger.error('Error fetching user:', error);
      res.status(500).json(createErrorResponse('Failed to fetch user', 'SERVER_ERROR'));
    }
  }

  /**
   * Create a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createUser(req, res) {
    try {
      const { email, password, firstName, lastName, roleType, jobRoleId, phone, address, hireDate } = req.body;
      const companyId = req.user.company_id;

      // Check if user with email already exists
      const existingUser = await User.getByEmail(email);
      if (existingUser) {
        return res.status(409).json(createErrorResponse('A user with this email already exists', 'EMAIL_EXISTS'));
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user data
      const userData = {
        companyId,
        email,
        passwordHash,
        firstName,
        lastName,
        roleType,
        jobRoleId,
        phone,
        address,
        hireDate
      };

      const newUser = await User.create(userData);

      logger.info(`New user created: ${newUser.id}`, {
        createdBy: req.user.id,
        companyId,
        email: newUser.email
      });

      res.status(201).json(createResponse({ user: newUser }));
    } catch (error) {
      logger.error('Error creating user:', error);
      res.status(500).json(createErrorResponse('Failed to create user', 'SERVER_ERROR'));
    }
  }

  /**
   * Update an existing user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;
      const requestingUserId = req.user.id;
      const userRole = req.user.role_type;

      // Check permissions
      if (userRole === 'employee' && id !== requestingUserId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Verify user exists and belongs to company
      const existingUser = await User.getById(id, companyId);
      if (!existingUser) {
        return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
      }

      // If updating email, check for conflicts
      if (req.body.email && req.body.email !== existingUser.email) {
        const emailExists = await User.getByEmail(req.body.email);
        if (emailExists) {
          return res.status(409).json(createErrorResponse('Email already in use', 'EMAIL_EXISTS'));
        }
      }

      const updatedUser = await User.update(id, req.body);

      logger.info(`User ${id} updated by ${requestingUserId}`, {
        updates: Object.keys(req.body)
      });

      res.json(createResponse({ user: updatedUser }));
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json(createErrorResponse('Failed to update user', 'SERVER_ERROR'));
    }
  }

  /**
   * Delete a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      // Verify user exists and belongs to company
      const existingUser = await User.getById(id, companyId);
      if (!existingUser) {
        return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
      }

      // Prevent self-deletion
      if (id === req.user.id) {
        return res.status(400).json(createErrorResponse('Cannot delete your own account', 'SELF_DELETE_FORBIDDEN'));
      }

      await User.delete(id);

      logger.info(`User ${id} deleted by ${req.user.id}`);
      res.json(createResponse({ message: 'User deleted successfully' }));
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json(createErrorResponse('Failed to delete user', 'SERVER_ERROR'));
    }
  }

  /**
   * Deactivate a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const user = await User.deactivate(id, companyId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
      }

      logger.info(`User ${id} deactivated by ${req.user.id}`);
      res.json(createResponse({ user, message: 'User deactivated successfully' }));
    } catch (error) {
      logger.error('Error deactivating user:', error);
      res.status(500).json(createErrorResponse('Failed to deactivate user', 'SERVER_ERROR'));
    }
  }

  /**
   * Reactivate a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async reactivateUser(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company_id;

      const user = await User.reactivate(id, companyId);
      if (!user) {
        return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
      }

      logger.info(`User ${id} reactivated by ${req.user.id}`);
      res.json(createResponse({ user, message: 'User reactivated successfully' }));
    } catch (error) {
      logger.error('Error reactivating user:', error);
      res.status(500).json(createErrorResponse('Failed to reactivate user', 'SERVER_ERROR'));
    }
  }

  /**
   * Get user work summary
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserWorkSummary(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const companyId = req.user.company_id;

      // Check permissions
      if (req.user.role_type === 'employee' && id !== req.user.id) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      const summary = await User.getWorkSummary(id, companyId, startDate, endDate);
      if (!summary) {
        return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
      }

      res.json(createResponse({ summary }));
    } catch (error) {
      logger.error('Error fetching user work summary:', error);
      res.status(500).json(createErrorResponse('Failed to fetch work summary', 'SERVER_ERROR'));
    }
  }
}

module.exports = new UserController();
