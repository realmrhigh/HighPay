const db = require('../config/database');
const logger = require('../utils/logger');
const { handleDatabaseError, notFoundError, validationError } = require('../middleware/errorHandler');
const { getPagination, createPaginationMeta, calculateHours } = require('../utils/helpers');
const { TABLES, PUNCH_TYPES, TIME_CONSTANTS } = require('../utils/constants');

/**
 * TimePunch Model - Handles all time tracking operations
 */
class TimePunch {
  /**
   * Create a new time punch
   * @param {object} punchData - Time punch information
   * @returns {Promise<object>} - Created time punch
   */
  static async create(punchData) {
    const {
      user_id,
      punch_type,
      timestamp = new Date(),
      notes,
      location_lat,
      location_lng,
      ip_address
    } = punchData;
    
    try {
      // Validate punch type
      if (!Object.values(PUNCH_TYPES).includes(punch_type)) {
        validationError('Invalid punch type');
      }
      
      // Check for duplicate punches within a short time frame (prevent double-tapping)
      const duplicateCheckQuery = `
        SELECT id FROM timepunches 
        WHERE user_id = $1 
        AND punch_type = $2 
        AND timestamp > $3 - INTERVAL '2 minutes'
        AND timestamp < $3 + INTERVAL '2 minutes'
      `;
      
      const duplicateResult = await db.query(duplicateCheckQuery, [user_id, punch_type, timestamp]);
      
      if (duplicateResult.rows.length > 0) {
        validationError('Duplicate punch detected. Please wait before punching again.');
      }
      
      // Validate punch sequence (business logic)
      await this.validatePunchSequence(user_id, punch_type, timestamp);
      
      const query = `
        INSERT INTO timepunches (
          user_id, punch_type, timestamp, notes, 
          location_lat, location_lng, ip_address, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [user_id, punch_type, timestamp, notes, location_lat, location_lng, ip_address];
      const result = await db.query(query, values);
      
      logger.info('Time punch created successfully', {
        punchId: result.rows[0].id,
        userId: user_id,
        punchType: punch_type,
        timestamp: timestamp
      });
      
      // Check if meal break reminder should be triggered
      await this.checkMealBreakReminder(user_id, timestamp);
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to create time punch', {
        error: error.message,
        userId: user_id,
        punchType: punch_type
      });
      handleDatabaseError(error, 'Time punch creation');
    }
  }

  /**
   * Validate punch sequence to ensure proper order
   * @param {number} userId - User ID
   * @param {string} punchType - Type of punch
   * @param {Date} timestamp - Punch timestamp
   */
  static async validatePunchSequence(userId, punchType, timestamp) {
    try {
      // Get the last punch for the day
      const lastPunchQuery = `
        SELECT punch_type, timestamp
        FROM timepunches 
        WHERE user_id = $1 
        AND DATE(timestamp) = DATE($2)
        ORDER BY timestamp DESC
        LIMIT 1
      `;
      
      const lastPunchResult = await db.query(lastPunchQuery, [userId, timestamp]);
      
      if (lastPunchResult.rows.length === 0) {
        // First punch of the day must be CLOCK_IN
        if (punchType !== PUNCH_TYPES.CLOCK_IN) {
          validationError('First punch of the day must be Clock In');
        }
        return;
      }
      
      const lastPunch = lastPunchResult.rows[0];
      
      // Define valid punch sequences
      const validSequences = {
        [PUNCH_TYPES.CLOCK_IN]: [PUNCH_TYPES.LUNCH_START, PUNCH_TYPES.BREAK_START, PUNCH_TYPES.CLOCK_OUT],
        [PUNCH_TYPES.LUNCH_START]: [PUNCH_TYPES.LUNCH_END],
        [PUNCH_TYPES.LUNCH_END]: [PUNCH_TYPES.LUNCH_START, PUNCH_TYPES.BREAK_START, PUNCH_TYPES.CLOCK_OUT],
        [PUNCH_TYPES.BREAK_START]: [PUNCH_TYPES.BREAK_END],
        [PUNCH_TYPES.BREAK_END]: [PUNCH_TYPES.LUNCH_START, PUNCH_TYPES.BREAK_START, PUNCH_TYPES.CLOCK_OUT],
        [PUNCH_TYPES.CLOCK_OUT]: [PUNCH_TYPES.CLOCK_IN]
      };
      
      const allowedNextPunches = validSequences[lastPunch.punch_type] || [];
      
      if (!allowedNextPunches.includes(punchType)) {
        validationError(`Cannot ${punchType.toLowerCase().replace('_', ' ')} after ${lastPunch.punch_type.toLowerCase().replace('_', ' ')}`);
      }
      
      // Prevent clocking out too soon (less than 30 minutes after clock in)
      if (punchType === PUNCH_TYPES.CLOCK_OUT) {
        const clockInQuery = `
          SELECT timestamp
          FROM timepunches 
          WHERE user_id = $1 
          AND punch_type = $2
          AND DATE(timestamp) = DATE($3)
          ORDER BY timestamp DESC
          LIMIT 1
        `;
        
        const clockInResult = await db.query(clockInQuery, [UserId, PUNCH_TYPES.CLOCK_IN, timestamp]);
        
        if (clockInResult.rows.length > 0) {
          const clockInTime = new Date(clockInResult.rows[0].timestamp);
          const timeDiff = (new Date(timestamp) - clockInTime) / (1000 * 60); // minutes
          
          if (timeDiff < 30) {
            validationError('Cannot clock out within 30 minutes of clocking in');
          }
        }
      }
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to validate punch sequence', { error: error.message, userId, punchType });
      handleDatabaseError(error, 'Punch sequence validation');
    }
  }

  /**
   * Check if meal break reminder should be triggered
   * @param {number} userId - User ID
   * @param {Date} timestamp - Current timestamp
   */
  static async checkMealBreakReminder(userId, timestamp) {
    try {
      // Find the clock-in time for the current day
      const clockInQuery = `
        SELECT timestamp
        FROM timepunches 
        WHERE user_id = $1 
        AND punch_type = $2
        AND DATE(timestamp) = DATE($3)
        ORDER BY timestamp ASC
        LIMIT 1
      `;
      
      const clockInResult = await db.query(clockInQuery, [userId, PUNCH_TYPES.CLOCK_IN, timestamp]);
      
      if (clockInResult.rows.length === 0) return;
      
      const clockInTime = new Date(clockInResult.rows[0].timestamp);
      const hoursWorked = calculateHours(clockInTime, timestamp);
      
      // Check if meal break is required and hasn't been taken
      if (hoursWorked >= TIME_CONSTANTS.MEAL_BREAK_THRESHOLD_HOURS) {
        const mealBreakQuery = `
          SELECT COUNT(*) as count
          FROM timepunches 
          WHERE user_id = $1 
          AND punch_type IN ($2, $3)
          AND DATE(timestamp) = DATE($4)
        `;
        
        const mealBreakResult = await db.query(mealBreakQuery, [
          userId, 
          PUNCH_TYPES.LUNCH_START, 
          PUNCH_TYPES.LUNCH_END, 
          timestamp
        ]);
        
        const mealBreakCount = parseInt(mealBreakResult.rows[0].count);
        
        if (mealBreakCount === 0) {
          logger.info('Meal break reminder triggered', { userId, hoursWorked });
          // Here you would trigger the push notification
          // This will be implemented in the push notification service
        }
      }
    } catch (error) {
      logger.error('Failed to check meal break reminder', { error: error.message, userId });
      // Don't throw error for non-critical operation
    }
  }

  /**
   * Get time punches for a user with date filtering
   * @param {number} userId - User ID
   * @param {object} filters - Date and type filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} - Time punches with pagination
   */
  static async getByUser(userId, filters = {}, pagination = {}) {
    try {
      const { page, limit, offset } = getPagination(pagination.page, pagination.limit);
      const { startDate, endDate, punchType, date } = filters;
      
      let whereClause = 'WHERE tp.user_id = $1';
      const queryParams = [userId];
      let paramCounter = 2;
      
      if (date) {
        whereClause += ` AND DATE(tp.timestamp) = $${paramCounter}`;
        queryParams.push(date);
        paramCounter++;
      } else {
        if (startDate) {
          whereClause += ` AND DATE(tp.timestamp) >= $${paramCounter}`;
          queryParams.push(startDate);
          paramCounter++;
        }
        
        if (endDate) {
          whereClause += ` AND DATE(tp.timestamp) <= $${paramCounter}`;
          queryParams.push(endDate);
          paramCounter++;
        }
      }
      
      if (punchType) {
        whereClause += ` AND tp.punch_type = $${paramCounter}`;
        queryParams.push(punchType);
        paramCounter++;
      }
      
      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM timepunches tp
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          tp.*,
          u.name as user_name,
          u.email as user_email
        FROM timepunches tp
        LEFT JOIN users u ON tp.user_id = u.id
        ${whereClause}
        ORDER BY tp.timestamp DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);
      
      return {
        punches: dataResult.rows,
        pagination: createPaginationMeta(totalCount, page, limit)
      };
    } catch (error) {
      logger.error('Failed to get time punches by user', {
        error: error.message,
        userId,
        filters
      });
      handleDatabaseError(error, 'Time punches lookup');
    }
  }

  /**
   * Get daily summary for a user
   * @param {number} userId - User ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Promise<object>} - Daily summary
   */
  static async getDailySummary(userId, date) {
    try {
      const query = `
        SELECT 
          u.name as user_name,
          DATE($2) as work_date,
          array_agg(
            json_build_object(
              'punch_type', tp.punch_type,
              'timestamp', tp.timestamp,
              'notes', tp.notes
            ) ORDER BY tp.timestamp
          ) as punches,
          COUNT(*) as total_punches,
          COUNT(CASE WHEN tp.punch_type = 'CLOCK_IN' THEN 1 END) as clock_ins,
          COUNT(CASE WHEN tp.punch_type = 'CLOCK_OUT' THEN 1 END) as clock_outs,
          MIN(CASE WHEN tp.punch_type = 'CLOCK_IN' THEN tp.timestamp END) as first_clock_in,
          MAX(CASE WHEN tp.punch_type = 'CLOCK_OUT' THEN tp.timestamp END) as last_clock_out
        FROM users u
        LEFT JOIN timepunches tp ON u.id = tp.user_id AND DATE(tp.timestamp) = $2
        WHERE u.id = $1
        GROUP BY u.id, u.name
      `;
      
      const result = await db.query(query, [userId, date]);
      
      if (result.rows.length === 0) {
        notFoundError('User');
      }
      
      const summary = result.rows[0];
      
      // Calculate total hours worked
      if (summary.first_clock_in && summary.last_clock_out) {
        summary.total_hours = calculateHours(summary.first_clock_in, summary.last_clock_out);
        
        // Calculate break time
        const breakTimeQuery = `
          SELECT 
            SUM(
              EXTRACT(EPOCH FROM (
                COALESCE(lunch_end.timestamp, break_end.timestamp) - 
                COALESCE(lunch_start.timestamp, break_start.timestamp)
              )) / 3600
            ) as break_hours
          FROM timepunches lunch_start
          LEFT JOIN timepunches lunch_end ON lunch_start.user_id = lunch_end.user_id 
            AND DATE(lunch_start.timestamp) = DATE(lunch_end.timestamp)
            AND lunch_end.punch_type = 'LUNCH_END'
            AND lunch_end.timestamp > lunch_start.timestamp
          LEFT JOIN timepunches break_start ON lunch_start.user_id = break_start.user_id 
            AND DATE(lunch_start.timestamp) = DATE(break_start.timestamp)
            AND break_start.punch_type = 'BREAK_START'
          LEFT JOIN timepunches break_end ON break_start.user_id = break_end.user_id 
            AND DATE(break_start.timestamp) = DATE(break_end.timestamp)
            AND break_end.punch_type = 'BREAK_END'
            AND break_end.timestamp > break_start.timestamp
          WHERE lunch_start.user_id = $1 
          AND DATE(lunch_start.timestamp) = $2
          AND lunch_start.punch_type IN ('LUNCH_START', 'BREAK_START')
        `;
        
        const breakResult = await db.query(breakTimeQuery, [userId, date]);
        summary.break_hours = parseFloat(breakResult.rows[0].break_hours) || 0;
        summary.worked_hours = summary.total_hours - summary.break_hours;
      } else {
        summary.total_hours = 0;
        summary.break_hours = 0;
        summary.worked_hours = 0;
      }
      
      return summary;
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to get daily summary', {
        error: error.message,
        userId,
        date
      });
      handleDatabaseError(error, 'Daily summary lookup');
    }
  }

  /**
   * Get weekly summary for a user
   * @param {number} userId - User ID
   * @param {string} startDate - Week start date (YYYY-MM-DD)
   * @returns {Promise<object>} - Weekly summary
   */
  static async getWeeklySummary(userId, startDate) {
    try {
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      
      const query = `
        SELECT 
          u.name as user_name,
          $2 as week_start,
          $3 as week_end,
          COUNT(DISTINCT DATE(tp.timestamp)) as days_worked,
          COUNT(*) as total_punches,
          SUM(
            CASE 
              WHEN tp.punch_type = 'CLOCK_OUT' THEN
                EXTRACT(EPOCH FROM (tp.timestamp - (
                  SELECT timestamp FROM timepunches tp2 
                  WHERE tp2.user_id = tp.user_id 
                  AND tp2.punch_type = 'CLOCK_IN'
                  AND DATE(tp2.timestamp) = DATE(tp.timestamp)
                  ORDER BY tp2.timestamp DESC LIMIT 1
                ))) / 3600
              ELSE 0
            END
          ) as total_hours
        FROM users u
        LEFT JOIN timepunches tp ON u.id = tp.user_id 
          AND DATE(tp.timestamp) BETWEEN $2 AND $3
        WHERE u.id = $1
        GROUP BY u.id, u.name
      `;
      
      const result = await db.query(query, [userId, startDate, endDate.toISOString().split('T')[0]]);
      
      if (result.rows.length === 0) {
        notFoundError('User');
      }
      
      const summary = result.rows[0];
      summary.total_hours = parseFloat(summary.total_hours) || 0;
      summary.overtime_hours = Math.max(0, summary.total_hours - TIME_CONSTANTS.OVERTIME_THRESHOLD_HOURS);
      summary.regular_hours = Math.min(summary.total_hours, TIME_CONSTANTS.OVERTIME_THRESHOLD_HOURS);
      
      return summary;
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to get weekly summary', {
        error: error.message,
        userId,
        startDate
      });
      handleDatabaseError(error, 'Weekly summary lookup');
    }
  }

  /**
   * Update time punch (limited fields for corrections)
   * @param {number} id - Time punch ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - Updated time punch
   */
  static async update(id, updateData) {
    try {
      const allowedFields = ['notes', 'timestamp'];
      const fieldsToUpdate = Object.keys(updateData).filter(key => allowedFields.includes(key));
      
      if (fieldsToUpdate.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fieldsToUpdate.map(field => updateData[field])];
      
      const query = `
        UPDATE timepunches 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        notFoundError('Time punch');
      }
      
      logger.info('Time punch updated successfully', {
        punchId: id,
        updatedFields: fieldsToUpdate
      });
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to update time punch', { error: error.message, punchId: id });
      handleDatabaseError(error, 'Time punch update');
    }
  }

  /**
   * Delete time punch (admin only, for corrections)
   * @param {number} id - Time punch ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = `
        DELETE FROM timepunches 
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        notFoundError('Time punch');
      }
      
      logger.info('Time punch deleted successfully', { punchId: id });
      
      return true;
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to delete time punch', { error: error.message, punchId: id });
      handleDatabaseError(error, 'Time punch deletion');
    }
  }

  /**
   * Get last punch for a user
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} - Last punch or null
   */
  static async getLastPunch(userId) {
    try {
      const query = `
        SELECT * FROM time_punches 
        WHERE user_id = $1 
        ORDER BY punch_time DESC 
        LIMIT 1
      `;
      const result = await db.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      handleDatabaseError(error, 'Get last punch');
    }
  }

  /**
   * Get today's punches for a user
   * @param {string} userId - User ID
   * @param {Date} date - Target date
   * @returns {Promise<object>} - Punches and summary
   */
  static async getTodaysPunches(userId, date = new Date()) {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const query = `
        SELECT 
          id, punch_type, punch_time, location_lat, location_lng, notes
        FROM time_punches
        WHERE user_id = $1 
        AND punch_time >= $2 
        AND punch_time <= $3
        ORDER BY punch_time ASC
      `;

      const result = await db.query(query, [userId, startOfDay, endOfDay]);
      const punches = result.rows;

      // Calculate summary
      const summary = this.calculateDaySummary(punches);

      return {
        punches: punches.map(punch => ({
          id: punch.id,
          type: punch.punch_type,
          timestamp: punch.punch_time,
          location: {
            latitude: punch.location_lat,
            longitude: punch.location_lng
          },
          notes: punch.notes
        })),
        summary
      };
    } catch (error) {
      handleDatabaseError(error, 'Get today\'s punches');
    }
  }

  /**
   * Get time punch history with pagination
   * @param {object} filters - Filter options
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} - Punches with pagination
   */
  static async getHistory(filters, pagination) {
    try {
      const { userId, startDate, endDate } = filters;
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE user_id = $1';
      const params = [userId];
      let paramCount = 1;

      if (startDate) {
        paramCount++;
        whereClause += ` AND punch_time >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        whereClause += ` AND punch_time <= $${paramCount}`;
        params.push(endDate);
      }

      // Main query
      const query = `
        SELECT 
          id, punch_type, punch_time, location_lat, location_lng, notes, created_at
        FROM time_punches
        ${whereClause}
        ORDER BY punch_time DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM time_punches
        ${whereClause}
      `;

      const [result, countResult] = await Promise.all([
        db.query(query, [...params, limit, offset]),
        db.query(countQuery, params)
      ]);

      return {
        punches: result.rows.map(punch => ({
          id: punch.id,
          type: punch.punch_type,
          timestamp: punch.punch_time,
          location: {
            latitude: punch.location_lat,
            longitude: punch.location_lng
          },
          notes: punch.notes,
          createdAt: punch.created_at
        })),
        pagination: {
          currentPage: page,
          totalItems: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit),
          limit
        }
      };
    } catch (error) {
      handleDatabaseError(error, 'Get punch history');
    }
  }

  /**
   * Get current punch status for user
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Current status
   */
  static async getCurrentStatus(userId) {
    try {
      const lastPunch = await this.getLastPunch(userId);
      
      const status = {
        isClockedIn: lastPunch ? lastPunch.punch_type === 'in' : false,
        lastPunch: lastPunch ? {
          id: lastPunch.id,
          type: lastPunch.punch_type,
          timestamp: lastPunch.punch_time
        } : null
      };

      // If clocked in, calculate current session duration
      if (status.isClockedIn) {
        const now = new Date();
        const punchTime = new Date(lastPunch.punch_time);
        const durationMs = now.getTime() - punchTime.getTime();
        
        status.currentSessionDuration = {
          hours: Math.floor(durationMs / (1000 * 60 * 60)),
          minutes: Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60)),
          totalMinutes: Math.floor(durationMs / (1000 * 60))
        };
      }

      return status;
    } catch (error) {
      handleDatabaseError(error, 'Get current status');
    }
  }

  /**
   * Validate user access for time tracking
   * @param {string} userId - User ID
   * @param {string} companyId - Company ID
   * @returns {Promise<object|null>} - User info or null
   */
  static async validateUserAccess(userId, companyId) {
    try {
      const query = `
        SELECT id, first_name, last_name, company_id
        FROM users
        WHERE id = $1 AND company_id = $2 AND is_active = true
      `;
      const result = await db.query(query, [userId, companyId]);
      return result.rows[0] || null;
    } catch (error) {
      handleDatabaseError(error, 'Validate user access');
    }
  }

  /**
   * Calculate day summary from punches
   * @param {Array} punches - Array of punch records
   * @returns {object} - Day summary
   */
  static calculateDaySummary(punches) {
    let totalMinutes = 0;
    let clockedIn = false;
    let currentSessionStart = null;
    let breakMinutes = 0;
    let punchPairs = [];

    for (let i = 0; i < punches.length; i++) {
      const punch = punches[i];
      
      if (punch.punch_type === 'in') {
        clockedIn = true;
        currentSessionStart = new Date(punch.punch_time);
      } else if (punch.punch_type === 'out' && currentSessionStart) {
        const sessionEnd = new Date(punch.punch_time);
        const sessionMinutes = (sessionEnd.getTime() - currentSessionStart.getTime()) / (1000 * 60);
        totalMinutes += sessionMinutes;
        
        punchPairs.push({
          in: currentSessionStart,
          out: sessionEnd,
          minutes: sessionMinutes
        });
        
        clockedIn = false;
        currentSessionStart = null;
      }
    }

    // If still clocked in, calculate current session
    let currentSessionMinutes = 0;
    if (clockedIn && currentSessionStart) {
      const now = new Date();
      currentSessionMinutes = (now.getTime() - currentSessionStart.getTime()) / (1000 * 60);
    }

    return {
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      totalMinutes: Math.round(totalMinutes),
      isClockedIn: clockedIn,
      currentSessionHours: Math.round((currentSessionMinutes / 60) * 100) / 100,
      currentSessionMinutes: Math.round(currentSessionMinutes),
      punchCount: punches.length,
      sessions: punchPairs.length,
      lastPunchTime: punches.length > 0 ? punches[punches.length - 1].punch_time : null
    };
  }
}

module.exports = TimePunch;
