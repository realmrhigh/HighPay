const db = require('../config/database');
const logger = require('../utils/logger');
const { hashPassword } = require('../utils/helpers');
const { handleDatabaseError, notFoundError } = require('../middleware/errorHandler');
const { USER_ROLES } = require('../utils/constants');

class User {
  /**
   * Create a new user
   * @param {object} userData - User data
   * @returns {object} - Created user
   */
  static async create(userData) {
    const {
      company_id,
      name,
      email,
      password,
      permission_role = USER_ROLES.EMPLOYEE,
      job_role_id = null
    } = userData;

    try {
      const hashedPassword = await hashPassword(password);
      
      const query = `
        INSERT INTO users (company_id, name, email, password_hash, permission_role, job_role_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, company_id, name, email, permission_role, job_role_id, created_at
      `;
      
      const values = [company_id, name, email, hashedPassword, permission_role, job_role_id];
      const result = await db.query(query, values);
      
      logger.info('User created successfully', { userId: result.rows[0].id, email });
      return result.rows[0];
    } catch (error) {
      handleDatabaseError(error, 'User creation');
    }
  }

  /**
   * Find user by ID with related data
   * @param {number} id - User ID
   * @returns {object|null} - User data or null if not found
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          u.id, u.company_id, u.name, u.email, u.permission_role, u.job_role_id, u.created_at,
          c.name as company_name,
          jr.role_name as job_title,
          jr.hourly_rate, jr.overtime_rate
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN jobroles jr ON u.job_role_id = jr.id
        WHERE u.id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      handleDatabaseError(error, 'Find user by ID');
    }
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {object|null} - User data or null if not found
   */
  static async findByEmail(email) {
    try {
      const query = `
        SELECT 
          u.id, u.company_id, u.name, u.email, u.password_hash, u.permission_role, 
          u.job_role_id, u.created_at,
          c.name as company_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.email = $1
      `;
      
      const result = await db.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      handleDatabaseError(error, 'Find user by email');
    }
  }

  /**
   * Get all users for a company with pagination
   * @param {number} companyId - Company ID
   * @param {object} options - Query options (page, limit, search, role)
   * @returns {object} - Users and pagination data
   */
  static async findByCompany(companyId, options = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      role = '',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = options;

    const offset = (page - 1) * limit;

    try {
      let whereClause = 'WHERE u.company_id = $1';
      let params = [companyId];
      let paramCount = 1;

      if (search) {
        paramCount++;
        whereClause += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (role) {
        paramCount++;
        whereClause += ` AND u.permission_role = $${paramCount}`;
        params.push(role);
      }

      // Validate sort column
      const allowedSortColumns = ['name', 'email', 'permission_role', 'created_at'];
      const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'name';
      const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM users u 
        ${whereClause}
      `;
      const countResult = await db.query(countQuery, params);
      const totalCount = parseInt(countResult.rows[0].count);

      // Get users
      const usersQuery = `
        SELECT 
          u.id, u.company_id, u.name, u.email, u.permission_role, u.job_role_id, u.created_at,
          jr.role_name as job_title,
          jr.hourly_rate
        FROM users u
        LEFT JOIN jobroles jr ON u.job_role_id = jr.id
        ${whereClause}
        ORDER BY u.${safeSortBy} ${safeSortOrder}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      
      params.push(limit, offset);
      const usersResult = await db.query(usersQuery, params);

      return {
        users: usersResult.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      handleDatabaseError(error, 'Find users by company');
    }
  }

  /**
   * Update user data
   * @param {number} id - User ID
   * @param {object} userData - Data to update
   * @returns {object} - Updated user data
   */
  static async update(id, userData) {
    const allowedFields = ['name', 'email', 'permission_role', 'job_role_id'];
    const updates = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic update query
    Object.keys(userData).forEach(key => {
      if (allowedFields.includes(key) && userData[key] !== undefined) {
        paramCount++;
        updates.push(`${key} = $${paramCount}`);
        values.push(userData[key]);
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    try {
      values.push(id); // Add ID as last parameter
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount + 1}
        RETURNING id, company_id, name, email, permission_role, job_role_id, created_at
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        notFoundError('User');
      }

      logger.info('User updated successfully', { userId: id });
      return result.rows[0];
    } catch (error) {
      handleDatabaseError(error, 'User update');
    }
  }

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} newPassword - New password
   * @returns {boolean} - Success status
   */
  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await hashPassword(newPassword);
      
      const query = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      const result = await db.query(query, [hashedPassword, id]);

      if (result.rowCount === 0) {
        notFoundError('User');
      }

      logger.info('User password updated', { userId: id });
      return true;
    } catch (error) {
      handleDatabaseError(error, 'Password update');
    }
  }

  /**
   * Soft delete a user (deactivate)
   * @param {number} id - User ID
   * @returns {boolean} - Success status
   */
  static async delete(id) {
    try {
      // For now, we'll actually delete the user
      // In a production system, you might want to add an 'is_active' field instead
      const query = 'DELETE FROM users WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rowCount === 0) {
        notFoundError('User');
      }

      logger.info('User deleted', { userId: id });
      return true;
    } catch (error) {
      handleDatabaseError(error, 'User deletion');
    }
  }

  /**
   * Check if email is already taken (excluding specific user)
   * @param {string} email - Email to check
   * @param {number} excludeUserId - User ID to exclude from check
   * @returns {boolean} - True if email exists
   */
  static async emailExists(email, excludeUserId = null) {
    try {
      let query = 'SELECT id FROM users WHERE email = $1';
      let params = [email];

      if (excludeUserId) {
        query += ' AND id != $2';
        params.push(excludeUserId);
      }

      const result = await db.query(query, params);
      return result.rows.length > 0;
    } catch (error) {
      handleDatabaseError(error, 'Email existence check');
    }
  }

  /**
   * Get user statistics for a company
   * @param {number} companyId - Company ID
   * @returns {object} - User statistics
   */
  static async getCompanyStats(companyId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN permission_role = 'admin' OR permission_role = 'Head Management' THEN 1 END) as admin_count,
          COUNT(CASE WHEN permission_role = 'manager' THEN 1 END) as manager_count,
          COUNT(CASE WHEN permission_role = 'employee' THEN 1 END) as employee_count,
          COUNT(CASE WHEN job_role_id IS NOT NULL THEN 1 END) as users_with_job_roles
        FROM users 
        WHERE company_id = $1
      `;

      const result = await db.query(query, [companyId]);
      return result.rows[0];
    } catch (error) {
      handleDatabaseError(error, 'Get company user statistics');
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {object|null} - User data or null if not found
   */
  static async getByEmail(email) {
    try {
      const query = `
        SELECT * FROM users WHERE email = $1
      `;
      const result = await db.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      handleDatabaseError(error, 'Get user by email');
    }
  }

  /**
   * Get user by email with company and job role details
   * @param {string} email - User email
   * @returns {object|null} - User data with details or null if not found
   */
  static async getByEmailWithDetails(email) {
    try {
      const query = `
        SELECT 
          u.*,
          c.name as company_name,
          jr.title as job_title
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN job_roles jr ON u.job_role_id = jr.id
        WHERE u.email = $1
      `;
      const result = await db.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      handleDatabaseError(error, 'Get user by email with details');
    }
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @param {string} companyId - Company ID (optional for authorization)
   * @returns {object|null} - User data or null if not found
   */
  static async getById(id, companyId = null) {
    try {
      let query = `
        SELECT 
          u.*,
          c.name as company_name,
          jr.title as job_title
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN job_roles jr ON u.job_role_id = jr.id
        WHERE u.id = $1
      `;
      
      const params = [id];
      
      if (companyId) {
        query += ` AND u.company_id = $2`;
        params.push(companyId);
      }
      
      const result = await db.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      handleDatabaseError(error, 'Get user by ID');
    }
  }

  /**
   * Get all users with filters and pagination
   * @param {object} filters - Filter options
   * @param {object} pagination - Pagination options
   * @returns {object} - Users data with pagination info
   */
  static async getAll(filters = {}, pagination = {}) {
    try {
      const { companyId, search = '', role = '' } = filters;
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE u.company_id = $1';
      let params = [companyId];
      let paramCount = 1;

      if (search) {
        paramCount++;
        whereClause += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      if (role) {
        paramCount++;
        whereClause += ` AND u.role_type = $${paramCount}`;
        params.push(role);
      }

      // Main query
      const query = `
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.role_type, u.phone, 
          u.address, u.hire_date, u.is_active, u.created_at, u.last_login_at,
          jr.title as job_title, jr.hourly_rate
        FROM users u
        LEFT JOIN job_roles jr ON u.job_role_id = jr.id
        ${whereClause}
        ORDER BY u.first_name, u.last_name
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users u 
        ${whereClause}
      `;

      const [result, countResult] = await Promise.all([
        db.query(query, [...params, limit, offset]),
        db.query(countQuery, params)
      ]);

      return {
        users: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalItems: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(countResult.rows[0].total / limit),
          limit: parseInt(limit),
        }
      };
    } catch (error) {
      handleDatabaseError(error, 'Get all users');
    }
  }

  /**
   * Update last login timestamp
   * @param {string} userId - User ID
   */
  static async updateLastLogin(userId) {
    try {
      const query = `
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP 
        WHERE id = $1
      `;
      await db.query(query, [userId]);
    } catch (error) {
      handleDatabaseError(error, 'Update last login');
    }
  }

  /**
   * Count total employees by company
   */
  static async countByCompany(companyId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM users WHERE companyId = ?';
      const [result] = await db.execute(query, [companyId]);
      return result[0].count;
    } catch (error) {
      logger.error('Error counting users by company:', error);
      throw error;
    }
  }

  /**
   * Count active employees by company
   */
  static async countActiveByCompany(companyId) {
    try {
      const query = 'SELECT COUNT(*) as count FROM users WHERE companyId = ? AND isActive = 1';
      const [result] = await db.execute(query, [companyId]);
      return result[0].count;
    } catch (error) {
      logger.error('Error counting active users by company:', error);
      throw error;
    }
  }

  /**
   * Count new hires within date range
   */
  static async countNewHires(companyId, dateRange) {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE companyId = ? 
          AND createdAt BETWEEN ? AND ?
      `;
      const [result] = await db.execute(query, [companyId, dateRange.startDate, dateRange.endDate]);
      return result[0].count;
    } catch (error) {
      logger.error('Error counting new hires:', error);
      throw error;
    }
  }

  /**
   * Count employees by company at specific date
   */
  static async countByCompanyAtDate(companyId, date) {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE companyId = ? 
          AND createdAt <= ?
          AND (updatedAt IS NULL OR updatedAt <= ? OR isActive = 1)
      `;
      const [result] = await db.execute(query, [companyId, date, date]);
      return result[0].count;
    } catch (error) {
      logger.error('Error counting users by company at date:', error);
      throw error;
    }
  }

  /**
   * Count departures within date range
   */
  static async countDepartures(companyId, dateRange) {
    try {
      const query = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE companyId = ? 
          AND isActive = 0
          AND updatedAt BETWEEN ? AND ?
      `;
      const [result] = await db.execute(query, [companyId, dateRange.startDate, dateRange.endDate]);
      return result[0].count;
    } catch (error) {
      logger.error('Error counting departures:', error);
      throw error;
    }
  }
}

module.exports = User;
