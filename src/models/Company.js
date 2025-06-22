const db = require('../config/database');
const logger = require('../utils/logger');
const { handleDatabaseError, notFoundError } = require('../middleware/errorHandler');
const { getPagination, createPaginationMeta } = require('../utils/helpers');
const { TABLES } = require('../utils/constants');

/**
 * Company Model - Handles all company-related database operations
 */
class Company {
  /**
   * Create a new company
   * @param {object} companyData - Company information
   * @returns {Promise<object>} - Created company
   */
  static async create(companyData) {
    const { name, industry, size, address, phone, email, website } = companyData;
    
    try {
      const query = `
        INSERT INTO companies (name, industry, size, address, phone, email, website, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [name, industry, size, address, phone, email, website];
      const result = await db.query(query, values);
      
      logger.info('Company created successfully', { 
        companyId: result.rows[0].id, 
        companyName: name 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create company', { error: error.message, companyData: { name, industry } });
      handleDatabaseError(error, 'Company creation');
    }
  }

  /**
   * Find company by ID
   * @param {number} id - Company ID
   * @returns {Promise<object>} - Company data
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          COUNT(DISTINCT u.id) as employee_count,
          COUNT(DISTINCT jr.id) as job_role_count,
          COUNT(DISTINCT p.id) as payroll_count
        FROM companies c
        LEFT JOIN users u ON c.id = u.company_id
        LEFT JOIN jobroles jr ON c.id = jr.company_id
        LEFT JOIN payrolls p ON c.id = p.company_id
        WHERE c.id = $1
        GROUP BY c.id
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        notFoundError('Company');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to find company by ID', { error: error.message, companyId: id });
      handleDatabaseError(error, 'Company lookup');
    }
  }

  /**
   * Update company information
   * @param {number} id - Company ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - Updated company
   */
  static async update(id, updateData) {
    try {
      // First check if company exists
      await this.findById(id);
      
      const allowedFields = ['name', 'industry', 'size', 'address', 'phone', 'email', 'website'];
      const fieldsToUpdate = Object.keys(updateData).filter(key => allowedFields.includes(key));
      
      if (fieldsToUpdate.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = [id, ...fieldsToUpdate.map(field => updateData[field])];
      
      const query = `
        UPDATE companies 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      
      logger.info('Company updated successfully', { 
        companyId: id, 
        updatedFields: fieldsToUpdate 
      });
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to update company', { error: error.message, companyId: id });
      handleDatabaseError(error, 'Company update');
    }
  }

  /**
   * Get company statistics
   * @param {number} id - Company ID
   * @returns {Promise<object>} - Company statistics
   */
  static async getStatistics(id) {
    try {
      const query = `
        SELECT 
          c.name as company_name,
          COUNT(DISTINCT u.id) as total_employees,
          COUNT(DISTINCT CASE WHEN u.permission_role IN ('admin', 'Head Management') THEN u.id END) as admin_count,
          COUNT(DISTINCT CASE WHEN u.permission_role = 'manager' THEN u.id END) as manager_count,
          COUNT(DISTINCT CASE WHEN u.permission_role = 'employee' THEN u.id END) as employee_count,
          COUNT(DISTINCT jr.id) as job_roles_count,
          COUNT(DISTINCT p.id) as total_payrolls,
          COUNT(DISTINCT CASE WHEN p.status = 'COMPLETED' THEN p.id END) as completed_payrolls,
          COALESCE(SUM(CASE WHEN p.status = 'COMPLETED' THEN p.total_cost END), 0) as total_payroll_cost,
          MAX(p.pay_date) as last_payroll_date
        FROM companies c
        LEFT JOIN users u ON c.id = u.company_id
        LEFT JOIN jobroles jr ON c.id = jr.company_id
        LEFT JOIN payrolls p ON c.id = p.company_id
        WHERE c.id = $1
        GROUP BY c.id, c.name
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        notFoundError('Company');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to get company statistics', { error: error.message, companyId: id });
      handleDatabaseError(error, 'Company statistics');
    }
  }

  /**
   * Get recent activity for a company
   * @param {number} id - Company ID
   * @param {number} limit - Number of activities to return
   * @returns {Promise<array>} - Recent activities
   */
  static async getRecentActivity(id, limit = 10) {
    try {
      const query = `
        (
          SELECT 'user_created' as activity_type, u.name as subject, u.created_at as activity_date,
                 'New employee added: ' || u.name as description
          FROM users u
          WHERE u.company_id = $1
        )
        UNION ALL
        (
          SELECT 'payroll_completed' as activity_type, 'Payroll #' || p.id as subject, p.created_at as activity_date,
                 'Payroll completed for period ' || p.pay_period_start || ' to ' || p.pay_period_end as description
          FROM payrolls p
          WHERE p.company_id = $1 AND p.status = 'COMPLETED'
        )
        UNION ALL
        (
          SELECT 'job_role_created' as activity_type, jr.role_name as subject, jr.created_at as activity_date,
                 'New job role created: ' || jr.role_name as description
          FROM jobroles jr
          WHERE jr.company_id = $1
        )
        ORDER BY activity_date DESC
        LIMIT $2
      `;
      
      const result = await db.query(query, [id, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Failed to get company recent activity', { error: error.message, companyId: id });
      handleDatabaseError(error, 'Company activity lookup');
    }
  }

  /**
   * Search companies (for admin purposes)
   * @param {object} filters - Search filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} - Search results with pagination
   */
  static async search(filters = {}, pagination = {}) {
    try {
      const { page, limit, offset } = getPagination(pagination.page, pagination.limit);
      const { name, industry, size } = filters;
      
      let whereClause = 'WHERE 1=1';
      const queryParams = [];
      let paramCounter = 1;
      
      if (name) {
        whereClause += ` AND c.name ILIKE $${paramCounter}`;
        queryParams.push(`%${name}%`);
        paramCounter++;
      }
      
      if (industry) {
        whereClause += ` AND c.industry = $${paramCounter}`;
        queryParams.push(industry);
        paramCounter++;
      }
      
      if (size) {
        whereClause += ` AND c.size = $${paramCounter}`;
        queryParams.push(size);
        paramCounter++;
      }
      
      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM companies c
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          c.*,
          COUNT(DISTINCT u.id) as employee_count
        FROM companies c
        LEFT JOIN users u ON c.id = u.company_id
        ${whereClause}
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);
      
      return {
        companies: dataResult.rows,
        pagination: createPaginationMeta(totalCount, page, limit)
      };
    } catch (error) {
      logger.error('Failed to search companies', { error: error.message, filters });
      handleDatabaseError(error, 'Company search');
    }
  }

  /**
   * Delete a company (soft delete - archive)
   * @param {number} id - Company ID
   * @returns {Promise<boolean>} - Success status
   */
  static async archive(id) {
    try {
      // Check if company exists
      await this.findById(id);
      
      // Check if company has active employees
      const activeEmployeesQuery = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE company_id = $1
      `;
      
      const activeResult = await db.query(activeEmployeesQuery, [id]);
      const activeEmployees = parseInt(activeResult.rows[0].count);
      
      if (activeEmployees > 0) {
        throw new Error('Cannot archive company with active employees');
      }
      
      const query = `
        UPDATE companies 
        SET archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [id]);
      
      logger.info('Company archived successfully', { companyId: id });
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to archive company', { error: error.message, companyId: id });
      handleDatabaseError(error, 'Company archival');
    }
  }
}

module.exports = Company;
