const db = require('../config/database');
const logger = require('../utils/logger');
const { handleDatabaseError, notFoundError } = require('../middleware/errorHandler');
const { getPagination, createPaginationMeta, formatCurrency } = require('../utils/helpers');
const { TABLES } = require('../utils/constants');

/**
 * PayStub Model - Handles all pay stub-related database operations
 */
class PayStub {
  /**
   * Find pay stub by ID with detailed information
   * @param {number} id - Pay stub ID
   * @returns {Promise<object>} - Pay stub data
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          ps.*,
          u.name as employee_name,
          u.email as employee_email,
          c.name as company_name,
          c.address as company_address,
          jr.role_name as job_title,
          p.pay_period_start,
          p.pay_period_end,
          p.pay_date,
          p.description as payroll_description
        FROM paystubs ps
        LEFT JOIN users u ON ps.user_id = u.id
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN jobroles jr ON u.job_role_id = jr.id
        LEFT JOIN payrolls p ON ps.payroll_id = p.id
        WHERE ps.id = $1
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        notFoundError('Pay stub');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to find pay stub by ID', { error: error.message, payStubId: id });
      handleDatabaseError(error, 'Pay stub lookup');
    }
  }

  /**
   * Get pay stubs for a user with pagination and filtering
   * @param {number} userId - User ID
   * @param {object} filters - Date and payroll filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} - Pay stubs with pagination
   */
  static async getByUser(userId, filters = {}, pagination = {}) {
    try {
      const { page, limit, offset } = getPagination(pagination.page, pagination.limit);
      const { startDate, endDate, payrollId, year } = filters;
      
      let whereClause = 'WHERE ps.user_id = $1';
      const queryParams = [userId];
      let paramCounter = 2;
      
      if (payrollId) {
        whereClause += ` AND ps.payroll_id = $${paramCounter}`;
        queryParams.push(payrollId);
        paramCounter++;
      }
      
      if (year) {
        whereClause += ` AND EXTRACT(YEAR FROM p.pay_date) = $${paramCounter}`;
        queryParams.push(year);
        paramCounter++;
      } else {
        if (startDate) {
          whereClause += ` AND p.pay_date >= $${paramCounter}`;
          queryParams.push(startDate);
          paramCounter++;
        }
        
        if (endDate) {
          whereClause += ` AND p.pay_date <= $${paramCounter}`;
          queryParams.push(endDate);
          paramCounter++;
        }
      }
      
      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM paystubs ps
        LEFT JOIN payrolls p ON ps.payroll_id = p.id
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          ps.*,
          p.pay_period_start,
          p.pay_period_end,
          p.pay_date,
          p.description as payroll_description,
          p.status as payroll_status
        FROM paystubs ps
        LEFT JOIN payrolls p ON ps.payroll_id = p.id
        ${whereClause}
        ORDER BY p.pay_date DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);
      
      return {
        payStubs: dataResult.rows,
        pagination: createPaginationMeta(totalCount, page, limit)
      };
    } catch (error) {
      logger.error('Failed to get pay stubs by user', {
        error: error.message,
        userId,
        filters
      });
      handleDatabaseError(error, 'Pay stubs lookup');
    }
  }

  /**
   * Get pay stubs for a company with filtering and pagination
   * @param {number} companyId - Company ID
   * @param {object} filters - Search filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} - Pay stubs with pagination
   */
  static async getByCompany(companyId, filters = {}, pagination = {}) {
    try {
      const { page, limit, offset } = getPagination(pagination.page, pagination.limit);
      const { userId, payrollId, startDate, endDate, minAmount, maxAmount } = filters;
      
      let whereClause = 'WHERE u.company_id = $1';
      const queryParams = [companyId];
      let paramCounter = 2;
      
      if (userId) {
        whereClause += ` AND ps.user_id = $${paramCounter}`;
        queryParams.push(userId);
        paramCounter++;
      }
      
      if (payrollId) {
        whereClause += ` AND ps.payroll_id = $${paramCounter}`;
        queryParams.push(payrollId);
        paramCounter++;
      }
      
      if (startDate) {
        whereClause += ` AND p.pay_date >= $${paramCounter}`;
        queryParams.push(startDate);
        paramCounter++;
      }
      
      if (endDate) {
        whereClause += ` AND p.pay_date <= $${paramCounter}`;
        queryParams.push(endDate);
        paramCounter++;
      }
      
      if (minAmount) {
        whereClause += ` AND ps.net_pay >= $${paramCounter}`;
        queryParams.push(minAmount);
        paramCounter++;
      }
      
      if (maxAmount) {
        whereClause += ` AND ps.net_pay <= $${paramCounter}`;
        queryParams.push(maxAmount);
        paramCounter++;
      }
      
      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM paystubs ps
        LEFT JOIN users u ON ps.user_id = u.id
        LEFT JOIN payrolls p ON ps.payroll_id = p.id
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          ps.*,
          u.name as employee_name,
          u.email as employee_email,
          jr.role_name as job_title,
          p.pay_period_start,
          p.pay_period_end,
          p.pay_date,
          p.description as payroll_description
        FROM paystubs ps
        LEFT JOIN users u ON ps.user_id = u.id
        LEFT JOIN jobroles jr ON u.job_role_id = jr.id
        LEFT JOIN payrolls p ON ps.payroll_id = p.id
        ${whereClause}
        ORDER BY p.pay_date DESC, u.name ASC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);
      
      return {
        payStubs: dataResult.rows,
        pagination: createPaginationMeta(totalCount, page, limit)
      };
    } catch (error) {
      logger.error('Failed to get pay stubs by company', {
        error: error.message,
        companyId,
        filters
      });
      handleDatabaseError(error, 'Company pay stubs lookup');
    }
  }

  /**
   * Get pay stub statistics for a user
   * @param {number} userId - User ID
   * @param {number} year - Year for statistics (optional)
   * @returns {Promise<object>} - Pay stub statistics
   */
  static async getUserStatistics(userId, year = null) {
    try {
      let whereClause = 'WHERE ps.user_id = $1';
      const queryParams = [userId];
      
      if (year) {
        whereClause += ' AND EXTRACT(YEAR FROM p.pay_date) = $2';
        queryParams.push(year);
      }
      
      const query = `
        SELECT 
          u.name as employee_name,
          u.email as employee_email,
          COUNT(ps.id) as total_pay_stubs,
          COALESCE(SUM(ps.gross_pay), 0) as total_gross_pay,
          COALESCE(SUM(ps.deductions), 0) as total_deductions,
          COALESCE(SUM(ps.net_pay), 0) as total_net_pay,
          COALESCE(SUM(ps.regular_hours), 0) as total_regular_hours,
          COALESCE(SUM(ps.overtime_hours), 0) as total_overtime_hours,
          COALESCE(AVG(ps.hourly_rate), 0) as average_hourly_rate,
          MIN(p.pay_date) as first_pay_date,
          MAX(p.pay_date) as last_pay_date,
          ${year ? year : 'EXTRACT(YEAR FROM CURRENT_DATE)'} as year
        FROM users u
        LEFT JOIN paystubs ps ON u.id = ps.user_id
        LEFT JOIN payrolls p ON ps.payroll_id = p.id
        ${whereClause}
        GROUP BY u.id, u.name, u.email
      `;
      
      const result = await db.query(query, queryParams);
      
      if (result.rows.length === 0) {
        notFoundError('User');
      }
      
      const stats = result.rows[0];
      stats.total_hours = parseFloat(stats.total_regular_hours) + parseFloat(stats.total_overtime_hours);
      stats.average_gross_per_pay = stats.total_pay_stubs > 0 ? 
        parseFloat(stats.total_gross_pay) / parseInt(stats.total_pay_stubs) : 0;
      
      return stats;
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to get user pay stub statistics', {
        error: error.message,
        userId,
        year
      });
      handleDatabaseError(error, 'User pay stub statistics');
    }
  }

  /**
   * Get monthly pay stub summary for a user
   * @param {number} userId - User ID
   * @param {number} year - Year
   * @returns {Promise<array>} - Monthly summaries
   */
  static async getMonthlyStatement(userId, year) {
    try {
      const query = `
        SELECT 
          EXTRACT(MONTH FROM p.pay_date) as month,
          TO_CHAR(p.pay_date, 'Month') as month_name,
          COUNT(ps.id) as pay_periods,
          COALESCE(SUM(ps.gross_pay), 0) as total_gross,
          COALESCE(SUM(ps.deductions), 0) as total_deductions,
          COALESCE(SUM(ps.net_pay), 0) as total_net,
          COALESCE(SUM(ps.regular_hours + ps.overtime_hours), 0) as total_hours
        FROM paystubs ps
        LEFT JOIN payrolls p ON ps.payroll_id = p.id
        WHERE ps.user_id = $1 
        AND EXTRACT(YEAR FROM p.pay_date) = $2
        GROUP BY EXTRACT(MONTH FROM p.pay_date), TO_CHAR(p.pay_date, 'Month')
        ORDER BY month
      `;
      
      const result = await db.query(query, [userId, year]);
      
      // Fill in missing months with zeros
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const monthlySummary = months.map((monthName, index) => {
        const monthData = result.rows.find(row => parseInt(row.month) === index + 1);
        
        return {
          month: index + 1,
          month_name: monthName,
          pay_periods: monthData ? parseInt(monthData.pay_periods) : 0,
          total_gross: monthData ? parseFloat(monthData.total_gross) : 0,
          total_deductions: monthData ? parseFloat(monthData.total_deductions) : 0,
          total_net: monthData ? parseFloat(monthData.total_net) : 0,
          total_hours: monthData ? parseFloat(monthData.total_hours) : 0
        };
      });
      
      return monthlySummary;
    } catch (error) {
      logger.error('Failed to get monthly pay stub statement', {
        error: error.message,
        userId,
        year
      });
      handleDatabaseError(error, 'Monthly pay stub statement');
    }
  }

  /**
   * Get pay stub for tax purposes (W-2 information)
   * @param {number} userId - User ID
   * @param {number} year - Tax year
   * @returns {Promise<object>} - Tax year summary
   */
  static async getTaxYearSummary(userId, year) {
    try {
      const query = `
        SELECT 
          u.name as employee_name,
          u.email as employee_email,
          c.name as company_name,
          c.address as company_address,
          c.ein as company_ein,
          $2 as tax_year,
          COUNT(ps.id) as total_pay_periods,
          COALESCE(SUM(ps.gross_pay), 0) as total_wages,
          COALESCE(SUM(ps.deductions), 0) as total_deductions,
          COALESCE(SUM(ps.net_pay), 0) as total_net_pay,
          COALESCE(SUM(ps.regular_hours + ps.overtime_hours), 0) as total_hours_worked,
          -- Estimated tax breakdowns (would need more detailed deduction tracking)
          COALESCE(SUM(ps.gross_pay * 0.12), 0) as estimated_federal_tax,
          COALESCE(SUM(ps.gross_pay * 0.062), 0) as estimated_social_security,
          COALESCE(SUM(ps.gross_pay * 0.0145), 0) as estimated_medicare,
          COALESCE(SUM(ps.gross_pay * 0.05), 0) as estimated_state_tax
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN paystubs ps ON u.id = ps.user_id
        LEFT JOIN payrolls p ON ps.payroll_id = p.id
        WHERE u.id = $1 
        AND EXTRACT(YEAR FROM p.pay_date) = $2
        GROUP BY u.id, u.name, u.email, c.name, c.address, c.ein
      `;
      
      const result = await db.query(query, [userId, year]);
      
      if (result.rows.length === 0) {
        notFoundError('User or no pay stubs found for the specified year');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to get tax year summary', {
        error: error.message,
        userId,
        year
      });
      handleDatabaseError(error, 'Tax year summary');
    }
  }

  /**
   * Update pay stub PDF URL after generation
   * @param {number} id - Pay stub ID
   * @param {string} pdfUrl - PDF file URL or path
   * @returns {Promise<object>} - Updated pay stub
   */
  static async updatePdfUrl(id, pdfUrl) {
    try {
      const query = `
        UPDATE paystubs 
        SET pdf_url = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [id, pdfUrl]);
      
      if (result.rows.length === 0) {
        notFoundError('Pay stub');
      }
      
      logger.info('Pay stub PDF URL updated', {
        payStubId: id,
        pdfUrl: pdfUrl
      });
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to update pay stub PDF URL', {
        error: error.message,
        payStubId: id
      });
      handleDatabaseError(error, 'Pay stub PDF URL update');
    }
  }

  /**
   * Generate pay stub data formatted for PDF generation
   * @param {number} id - Pay stub ID
   * @returns {Promise<object>} - Formatted pay stub data
   */
  static async getFormattedForPdf(id) {
    try {
      const payStub = await this.findById(id);
      
      return {
        company: {
          name: payStub.company_name,
          address: payStub.company_address
        },
        employee: {
          name: payStub.employee_name,
          email: payStub.employee_email,
          jobTitle: payStub.job_title
        },
        payPeriod: {
          start: payStub.pay_period_start,
          end: payStub.pay_period_end,
          payDate: payStub.pay_date
        },
        earnings: {
          regularHours: parseFloat(payStub.regular_hours) || 0,
          overtimeHours: parseFloat(payStub.overtime_hours) || 0,
          totalHours: (parseFloat(payStub.regular_hours) || 0) + (parseFloat(payStub.overtime_hours) || 0),
          hourlyRate: parseFloat(payStub.hourly_rate) || 0,
          overtimeRate: parseFloat(payStub.overtime_rate) || 0,
          regularPay: (parseFloat(payStub.regular_hours) || 0) * (parseFloat(payStub.hourly_rate) || 0),
          overtimePay: (parseFloat(payStub.overtime_hours) || 0) * (parseFloat(payStub.overtime_rate) || 0),
          grossPay: parseFloat(payStub.gross_pay) || 0
        },
        deductions: {
          total: parseFloat(payStub.deductions) || 0,
          // These would be broken down if stored separately
          federalTax: (parseFloat(payStub.gross_pay) || 0) * 0.12,
          stateTax: (parseFloat(payStub.gross_pay) || 0) * 0.05,
          socialSecurity: (parseFloat(payStub.gross_pay) || 0) * 0.062,
          medicare: (parseFloat(payStub.gross_pay) || 0) * 0.0145
        },
        netPay: parseFloat(payStub.net_pay) || 0,
        payStubId: payStub.id,
        generatedAt: new Date()
      };
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to format pay stub for PDF', {
        error: error.message,
        payStubId: id
      });
      handleDatabaseError(error, 'Pay stub PDF formatting');
    }
  }

  /**
   * Delete pay stub (admin only, for corrections)
   * @param {number} id - Pay stub ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const query = `
        DELETE FROM paystubs 
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        notFoundError('Pay stub');
      }
      
      logger.info('Pay stub deleted successfully', { payStubId: id });
      
      return true;
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to delete pay stub', { error: error.message, payStubId: id });
      handleDatabaseError(error, 'Pay stub deletion');
    }
  }
}

module.exports = PayStub;
