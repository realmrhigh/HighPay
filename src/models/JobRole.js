const db = require('../config/database');
const logger = require('../utils/logger');
const { handleDatabaseError, notFoundError } = require('../middleware/errorHandler');
const { getPagination, createPaginationMeta } = require('../utils/helpers');
const { TABLES } = require('../utils/constants');

/**
 * JobRole Model - Handles all job role-related database operations
 */
class JobRole {
  /**
   * Create a new job role
   * @param {object} jobRoleData - Job role information
   * @returns {Promise<object>} - Created job role
   */
  static async create(jobRoleData) {
    const {
      company_id,
      role_name,
      description,
      hourly_rate,
      overtime_rate,
      benefits,
      requirements,
      is_active = true
    } = jobRoleData;
    
    try {
      const query = `
        INSERT INTO jobroles (
          company_id, role_name, description, hourly_rate, overtime_rate,
          benefits, requirements, is_active, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        company_id, role_name, description, hourly_rate, overtime_rate,
        benefits, requirements, is_active
      ];
      
      const result = await db.query(query, values);
      
      logger.info('Job role created successfully', {
        jobRoleId: result.rows[0].id,
        roleName: role_name,
        companyId: company_id
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create job role', {
        error: error.message,
        roleName: role_name,
        companyId: company_id
      });
      handleDatabaseError(error, 'Job role creation');
    }
  }

  /**
   * Find job role by ID
   * @param {number} id - Job role ID
   * @returns {Promise<object>} - Job role data
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          jr.*,
          c.name as company_name,
          COUNT(DISTINCT u.id) as employee_count,
          COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_employee_count,
          AVG(CASE WHEN u.is_active = true THEN u.hourly_rate END) as avg_employee_rate
        FROM jobroles jr
        LEFT JOIN companies c ON jr.company_id = c.id
        LEFT JOIN users u ON jr.id = u.job_role_id
        WHERE jr.id = $1
        GROUP BY jr.id, c.name
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        notFoundError('Job role');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to find job role by ID', { error: error.message, jobRoleId: id });
      handleDatabaseError(error, 'Job role lookup');
    }
  }

  /**
   * Update job role information
   * @param {number} id - Job role ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - Updated job role
   */
  static async update(id, updateData) {
    try {
      // First check if job role exists
      await this.findById(id);
      
      const allowedFields = [
        'role_name', 'description', 'hourly_rate', 'overtime_rate',
        'benefits', 'requirements', 'is_active'
      ];
      
      const fieldsToUpdate = Object.keys(updateData).filter(key => allowedFields.includes(key));
      
      if (fieldsToUpdate.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fieldsToUpdate.map(field => updateData[field])];
      
      const query = `
        UPDATE jobroles 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      
      logger.info('Job role updated successfully', {
        jobRoleId: id,
        updatedFields: fieldsToUpdate
      });
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to update job role', { error: error.message, jobRoleId: id });
      handleDatabaseError(error, 'Job role update');
    }
  }

  /**
   * Get job roles by company with filtering and pagination
   * @param {number} companyId - Company ID
   * @param {object} filters - Search filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} - Job roles with pagination
   */
  static async getByCompany(companyId, filters = {}, pagination = {}) {
    try {
      const { page, limit, offset } = getPagination(pagination.page, pagination.limit);
      const { search, isActive, minRate, maxRate } = filters;
      
      let whereClause = 'WHERE jr.company_id = $1';
      const queryParams = [companyId];
      let paramCounter = 2;
      
      if (search) {
        whereClause += ` AND (jr.role_name ILIKE $${paramCounter} OR jr.description ILIKE $${paramCounter})`;
        queryParams.push(`%${search}%`);
        paramCounter++;
      }
      
      if (isActive !== undefined) {
        whereClause += ` AND jr.is_active = $${paramCounter}`;
        queryParams.push(isActive);
        paramCounter++;
      }
      
      if (minRate) {
        whereClause += ` AND jr.hourly_rate >= $${paramCounter}`;
        queryParams.push(minRate);
        paramCounter++;
      }
      
      if (maxRate) {
        whereClause += ` AND jr.hourly_rate <= $${paramCounter}`;
        queryParams.push(maxRate);
        paramCounter++;
      }
      
      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM jobroles jr
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          jr.*,
          COUNT(DISTINCT u.id) as employee_count,
          COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_employee_count,
          AVG(CASE WHEN u.is_active = true THEN u.hourly_rate END) as avg_employee_rate
        FROM jobroles jr
        LEFT JOIN users u ON jr.id = u.job_role_id
        ${whereClause}
        GROUP BY jr.id
        ORDER BY jr.created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);
      
      return {
        jobRoles: dataResult.rows,
        pagination: createPaginationMeta(totalCount, page, limit)
      };
    } catch (error) {
      logger.error('Failed to get job roles by company', {
        error: error.message,
        companyId,
        filters
      });
      handleDatabaseError(error, 'Job roles lookup');
    }
  }

  /**
   * Get job role statistics
   * @param {number} id - Job role ID
   * @returns {Promise<object>} - Job role statistics
   */
  static async getStatistics(id) {
    try {
      const query = `
        SELECT 
          jr.role_name,
          jr.hourly_rate,
          jr.overtime_rate,
          COUNT(DISTINCT u.id) as total_employees,
          COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_employees,
          AVG(CASE WHEN u.is_active = true THEN u.hourly_rate END) as avg_employee_rate,
          MIN(u.hire_date) as earliest_hire_date,
          MAX(u.hire_date) as latest_hire_date,
          COUNT(DISTINCT tp.id) as total_time_punches,
          COUNT(DISTINCT DATE(tp.timestamp)) as total_work_days,
          COALESCE(SUM(ps.gross_pay), 0) as total_payroll_gross,
          COALESCE(SUM(ps.net_pay), 0) as total_payroll_net
        FROM jobroles jr
        LEFT JOIN users u ON jr.id = u.job_role_id
        LEFT JOIN timepunches tp ON u.id = tp.user_id
        LEFT JOIN paystubs ps ON u.id = ps.user_id
        WHERE jr.id = $1
        GROUP BY jr.id, jr.role_name, jr.hourly_rate, jr.overtime_rate
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        notFoundError('Job role');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to get job role statistics', {
        error: error.message,
        jobRoleId: id
      });
      handleDatabaseError(error, 'Job role statistics');
    }
  }

  /**
   * Get employees in a job role
   * @param {number} id - Job role ID
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} - Employees with pagination
   */
  static async getEmployees(id, pagination = {}) {
    try {
      const { page, limit, offset } = getPagination(pagination.page, pagination.limit);
      
      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        WHERE u.job_role_id = $1
      `;
      
      const countResult = await db.query(countQuery, [id]);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          u.id, u.name, u.email, u.permission_role, u.hourly_rate,
          u.hire_date, u.is_active, u.last_login,
          COUNT(DISTINCT tp.id) as total_punches,
          COUNT(DISTINCT ps.id) as total_pay_stubs,
          COALESCE(SUM(ps.net_pay), 0) as total_earnings
        FROM users u
        LEFT JOIN timepunches tp ON u.id = tp.user_id
        LEFT JOIN paystubs ps ON u.id = ps.user_id
        WHERE u.job_role_id = $1
        GROUP BY u.id
        ORDER BY u.hire_date DESC
        LIMIT $2 OFFSET $3
      `;
      
      const dataResult = await db.query(dataQuery, [id, limit, offset]);
      
      return {
        employees: dataResult.rows,
        pagination: createPaginationMeta(totalCount, page, limit)
      };
    } catch (error) {
      logger.error('Failed to get job role employees', {
        error: error.message,
        jobRoleId: id
      });
      handleDatabaseError(error, 'Job role employees lookup');
    }
  }

  /**
   * Delete job role (only if no employees assigned)
   * @param {number} id - Job role ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      // Check if job role exists
      await this.findById(id);
      
      // Check if any employees are assigned to this role
      const employeeCheckQuery = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE job_role_id = $1
      `;
      
      const employeeResult = await db.query(employeeCheckQuery, [id]);
      const employeeCount = parseInt(employeeResult.rows[0].count);
      
      if (employeeCount > 0) {
        throw new Error(`Cannot delete job role with ${employeeCount} assigned employees`);
      }
      
      const deleteQuery = `
        DELETE FROM jobroles 
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(deleteQuery, [id]);
      
      logger.info('Job role deleted successfully', { jobRoleId: id });
      
      return true;
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to delete job role', { error: error.message, jobRoleId: id });
      handleDatabaseError(error, 'Job role deletion');
    }
  }

  /**
   * Archive job role (soft delete)
   * @param {number} id - Job role ID
   * @returns {Promise<object>} - Updated job role
   */
  static async archive(id) {
    try {
      return await this.update(id, { is_active: false });
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to archive job role', { error: error.message, jobRoleId: id });
      handleDatabaseError(error, 'Job role archival');
    }
  }

  /**
   * Restore archived job role
   * @param {number} id - Job role ID
   * @returns {Promise<object>} - Updated job role
   */
  static async restore(id) {
    try {
      return await this.update(id, { is_active: true });
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to restore job role', { error: error.message, jobRoleId: id });
      handleDatabaseError(error, 'Job role restoration');
    }
  }

  /**
   * Get job role by title within a company
   * @param {string} title - Job role title
   * @param {string} companyId - Company ID
   * @returns {Promise<object|null>} - Job role or null if not found
   */
  static async getByTitle(title, companyId) {
    try {
      const query = `
        SELECT * FROM job_roles 
        WHERE company_id = $1 AND title ILIKE $2 AND is_active = true
      `;
      const result = await db.query(query, [companyId, title]);
      return result.rows[0] || null;
    } catch (error) {
      handleDatabaseError(error, 'Get job role by title');
    }
  }

  /**
   * Get all job roles for a company with filters
   * @param {object} filters - Filter options
   * @returns {Promise<Array>} - Array of job roles
   */
  static async getAll(filters = {}) {
    try {
      const { companyId, active = 'true', search = '' } = filters;
      
      let whereClause = 'WHERE jr.company_id = $1';
      let params = [companyId];
      let paramCount = 1;

      if (active === 'true') {
        whereClause += ' AND jr.is_active = true';
      } else if (active === 'false') {
        whereClause += ' AND jr.is_active = false';
      }

      if (search) {
        paramCount++;
        whereClause += ` AND (jr.title ILIKE $${paramCount} OR jr.description ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }

      const query = `
        SELECT 
          jr.id, jr.title, jr.hourly_rate, jr.overtime_rate, 
          jr.description, jr.is_active, jr.created_at, jr.updated_at,
          COUNT(u.id) as employee_count
        FROM job_roles jr
        LEFT JOIN users u ON jr.id = u.job_role_id AND u.is_active = true
        ${whereClause}
        GROUP BY jr.id
        ORDER BY jr.title ASC
      `;

      const result = await db.query(query, params);
      
      return result.rows.map(role => ({
        ...role,
        hourly_rate: parseFloat(role.hourly_rate),
        overtime_rate: role.overtime_rate ? parseFloat(role.overtime_rate) : null,
        employee_count: parseInt(role.employee_count, 10)
      }));
    } catch (error) {
      handleDatabaseError(error, 'Get all job roles');
    }
  }

  /**
   * Get job role by ID
   * @param {string} id - Job role ID
   * @param {string} companyId - Company ID (optional for authorization)
   * @returns {Promise<object|null>} - Job role or null if not found
   */
  static async getById(id, companyId = null) {
    try {
      let query = `
        SELECT 
          jr.*,
          COUNT(u.id) as employee_count
        FROM job_roles jr
        LEFT JOIN users u ON jr.id = u.job_role_id AND u.is_active = true
        WHERE jr.id = $1
      `;
      
      const params = [id];
      
      if (companyId) {
        query += ` AND jr.company_id = $2`;
        params.push(companyId);
      }
      
      query += ` GROUP BY jr.id`;
      
      const result = await db.query(query, params);
      
      if (result.rows[0]) {
        const jobRole = result.rows[0];
        return {
          ...jobRole,
          hourly_rate: parseFloat(jobRole.hourly_rate),
          overtime_rate: jobRole.overtime_rate ? parseFloat(jobRole.overtime_rate) : null,
          employee_count: parseInt(jobRole.employee_count, 10)
        };
      }
      
      return null;
    } catch (error) {
      handleDatabaseError(error, 'Get job role by ID');
    }
  }

  /**
   * Get employees assigned to a job role
   * @param {string} id - Job role ID
   * @param {string} companyId - Company ID
   * @returns {Promise<Array>} - Array of employees
   */
  static async getEmployees(id, companyId) {
    try {
      const query = `
        SELECT 
          u.id, u.first_name, u.last_name, u.email, 
          u.hire_date, u.is_active
        FROM users u
        WHERE u.job_role_id = $1 AND u.company_id = $2 AND u.is_active = true
        ORDER BY u.first_name, u.last_name
      `;
      
      const result = await db.query(query, [id, companyId]);
      return result.rows;
    } catch (error) {
      handleDatabaseError(error, 'Get job role employees');
    }
  }
}

module.exports = JobRole;
