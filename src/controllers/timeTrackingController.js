const TimePunch = require('../models/TimePunch');
const { createResponse, createErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const pushNotificationService = require('../services/pushNotificationService');

class TimeTrackingController {
  /**
   * Create a new time punch (clock in/out)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTimePunch(req, res) {
    try {
      const { type, timestamp, location, notes } = req.body;
      const userId = req.user.id;

      // Validate punch sequence (prevent double punch-in/out)
      const lastPunch = await TimePunch.getLastPunch(userId);
      if (lastPunch && lastPunch.punch_type === type) {
        const message = type === 'in' 
          ? 'You are already clocked in. Please clock out first.'
          : 'You are already clocked out. Please clock in first.';
        return res.status(400).json(createErrorResponse(message, 'INVALID_PUNCH_SEQUENCE'));
      }

      // Create punch data
      const punchData = {
        userId,
        punchType: type,
        punchTime: timestamp || new Date(),
        locationLat: location?.latitude || null,
        locationLng: location?.longitude || null,
        notes: notes || null
      };

      const newPunch = await TimePunch.create(punchData);

      // Send push notification
      try {
        if (req.user.device_tokens?.length > 0) {
          await pushNotificationService.sendPunchNotification(
            req.user.device_tokens,
            {
              type,
              time: new Date(newPunch.punch_time).toLocaleTimeString(),
              timestamp: newPunch.punch_time,
              userId
            }
          );
        }
      } catch (notificationError) {
        logger.warn('Failed to send punch notification:', notificationError);
        // Don't fail the request if notification fails
      }

      logger.info(`Time punch recorded: ${type}`, {
        userId,
        punchId: newPunch.id,
        type,
        timestamp: newPunch.punch_time
      });

      res.status(201).json(createResponse({
        punch: {
          id: newPunch.id,
          userId: newPunch.user_id,
          type: newPunch.punch_type,
          timestamp: newPunch.punch_time,
          location: {
            latitude: newPunch.location_lat,
            longitude: newPunch.location_lng
          },
          notes: newPunch.notes
        }
      }));
    } catch (error) {
      logger.error('Error creating time punch:', error);
      res.status(500).json(createErrorResponse('Failed to record time punch', 'SERVER_ERROR'));
    }
  }

  /**
   * Get today's time punches for current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTodaysPunches(req, res) {
    try {
      const userId = req.user.id;
      const today = new Date();
      
      const result = await TimePunch.getTodaysPunches(userId, today);

      logger.info(`Retrieved today's punches for user ${userId}`, {
        userId,
        punchCount: result.punches.length,
        totalHours: result.summary.totalHours
      });

      res.json(createResponse(result));
    } catch (error) {
      logger.error('Error fetching today\'s punches:', error);
      res.status(500).json(createErrorResponse('Failed to fetch today\'s punches', 'SERVER_ERROR'));
    }
  }

  /**
   * Get time punch history for a user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTimePunchHistory(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate, page = 1, limit = 50 } = req.query;
      const requestingUserId = req.user.id;
      const userRole = req.user.role_type;

      // Check permissions: admin/manager can view any user, employee can only view self
      if (userRole === 'employee' && id !== requestingUserId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      // Verify user exists and belongs to same company
      if (userRole !== 'employee') {
        const targetUser = await TimePunch.validateUserAccess(id, req.user.company_id);
        if (!targetUser) {
          return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
        }
      }

      const filters = {
        userId: id,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      };

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await TimePunch.getHistory(filters, pagination);

      res.json(createResponse(result));
    } catch (error) {
      logger.error('Error fetching time punch history:', error);
      res.status(500).json(createErrorResponse('Failed to fetch time punch history', 'SERVER_ERROR'));
    }
  }

  /**
   * Get time punch summary for a user and date range
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTimePunchSummary(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      const requestingUserId = req.user.id;
      const userRole = req.user.role_type;

      // Check permissions
      if (userRole === 'employee' && id !== requestingUserId) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      if (!startDate || !endDate) {
        return res.status(400).json(createErrorResponse('Start date and end date are required', 'MISSING_DATE_RANGE'));
      }

      const summary = await TimePunch.getSummary(
        id,
        new Date(startDate),
        new Date(endDate),
        req.user.company_id
      );

      if (!summary) {
        return res.status(404).json(createErrorResponse('User not found', 'USER_NOT_FOUND'));
      }

      res.json(createResponse({ summary }));
    } catch (error) {
      logger.error('Error fetching time punch summary:', error);
      res.status(500).json(createErrorResponse('Failed to fetch time punch summary', 'SERVER_ERROR'));
    }
  }

  /**
   * Update a time punch (admin/manager only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateTimePunch(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Get existing punch
      const existingPunch = await TimePunch.getById(id);
      if (!existingPunch) {
        return res.status(404).json(createErrorResponse('Time punch not found', 'PUNCH_NOT_FOUND'));
      }

      // Verify punch belongs to company
      if (existingPunch.company_id !== req.user.company_id) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      const updatedPunch = await TimePunch.update(id, updates);

      logger.info(`Time punch ${id} updated by ${req.user.id}`, {
        punchId: id,
        updatedBy: req.user.id,
        updates: Object.keys(updates)
      });

      res.json(createResponse({ punch: updatedPunch }));
    } catch (error) {
      logger.error('Error updating time punch:', error);
      res.status(500).json(createErrorResponse('Failed to update time punch', 'SERVER_ERROR'));
    }
  }

  /**
   * Delete a time punch (admin/manager only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteTimePunch(req, res) {
    try {
      const { id } = req.params;

      // Get existing punch
      const existingPunch = await TimePunch.getById(id);
      if (!existingPunch) {
        return res.status(404).json(createErrorResponse('Time punch not found', 'PUNCH_NOT_FOUND'));
      }

      // Verify punch belongs to company
      if (existingPunch.company_id !== req.user.company_id) {
        return res.status(403).json(createErrorResponse('Access denied', 'FORBIDDEN'));
      }

      await TimePunch.delete(id);

      logger.info(`Time punch ${id} deleted by ${req.user.id}`, {
        punchId: id,
        deletedBy: req.user.id,
        originalUserId: existingPunch.user_id
      });

      res.json(createResponse({ message: 'Time punch deleted successfully' }));
    } catch (error) {
      logger.error('Error deleting time punch:', error);
      res.status(500).json(createErrorResponse('Failed to delete time punch', 'SERVER_ERROR'));
    }
  }

  /**
   * Get current punch status for user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCurrentStatus(req, res) {
    try {
      const userId = req.user.id;
      
      const status = await TimePunch.getCurrentStatus(userId);

      res.json(createResponse({ status }));
    } catch (error) {
      logger.error('Error fetching current punch status:', error);
      res.status(500).json(createErrorResponse('Failed to fetch punch status', 'SERVER_ERROR'));
    }
  }

  /**
   * Get team time tracking overview (manager/admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTeamOverview(req, res) {
    try {
      const { date } = req.query;
      const companyId = req.user.company_id;
      const targetDate = date ? new Date(date) : new Date();

      const overview = await TimePunch.getTeamOverview(companyId, targetDate);

      res.json(createResponse({ overview }));
    } catch (error) {
      logger.error('Error fetching team overview:', error);
      res.status(500).json(createErrorResponse('Failed to fetch team overview', 'SERVER_ERROR'));
    }
  }

  /**
   * Export time tracking data (admin/manager only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async exportTimeData(req, res) {
    try {
      const { startDate, endDate, userId, format = 'csv' } = req.query;
      const companyId = req.user.company_id;

      if (!startDate || !endDate) {
        return res.status(400).json(createErrorResponse('Start date and end date are required', 'MISSING_DATE_RANGE'));
      }

      const filters = {
        companyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        userId: userId || null
      };

      const exportData = await TimePunch.exportData(filters, format);

      // Set appropriate headers for file download
      const filename = `time-tracking-${startDate}-to-${endDate}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');

      res.send(exportData);
    } catch (error) {
      logger.error('Error exporting time data:', error);
      res.status(500).json(createErrorResponse('Failed to export time data', 'SERVER_ERROR'));
    }
  }
}

module.exports = new TimeTrackingController();
