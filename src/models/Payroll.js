const db = require('../config/database');
const logger = require('../utils/logger');
const { handleDatabaseError, notFoundError, validationError } = require('../middleware/errorHandler');
const { getPagination, createPaginationMeta, formatCurrency, calculateHours } = require('../utils/helpers');
const { TABLES, PAYROLL_STATUS, TIME_CONSTANTS } = require('../utils/constants');

/**
 * Payroll Model - Handles all payroll-related database operations
 */
class Payroll {
  /**
   * Create a new payroll run
   * @param {object} payrollData - Payroll information
   * @returns {Promise<object>} - Created payroll
   */
  static async create(payrollData) {
    const {
      company_id,
      pay_period_start,
      pay_period_end,
      pay_date,
      description,
      created_by
    } = payrollData;
    
    try {
      // Validate dates
      const startDate = new Date(pay_period_start);
      const endDate = new Date(pay_period_end);
      const paymentDate = new Date(pay_date);
      
      if (endDate <= startDate) {
        validationError('Pay period end date must be after start date');
      }
      
      if (paymentDate < endDate) {
        validationError('Pay date must be on or after pay period end date');
      }
      
      // Check for overlapping payroll periods
      const overlapQuery = `
        SELECT id FROM payrolls 
        WHERE company_id = $1 
        AND (
          (pay_period_start <= $2 AND pay_period_end >= $2) OR
          (pay_period_start <= $3 AND pay_period_end >= $3) OR
          (pay_period_start >= $2 AND pay_period_end <= $3)
        )
        AND status NOT IN ('CANCELLED')
      `;
      
      const overlapResult = await db.query(overlapQuery, [company_id, pay_period_start, pay_period_end]);
      
      if (overlapResult.rows.length > 0) {
        validationError('Payroll period overlaps with existing payroll');
      }
      
      const query = `
        INSERT INTO payrolls (
          company_id, pay_period_start, pay_period_end, pay_date,
          description, status, created_by, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        company_id, pay_period_start, pay_period_end, pay_date,
        description, PAYROLL_STATUS.DRAFT, created_by
      ];
      
      const result = await db.query(query, values);
      
      logger.info('Payroll created successfully', {
        payrollId: result.rows[0].id,
        companyId: company_id,
        payPeriod: `${pay_period_start} to ${pay_period_end}`
      });
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to create payroll', {
        error: error.message,
        companyId: company_id,
        payPeriod: `${pay_period_start} to ${pay_period_end}`
      });
      handleDatabaseError(error, 'Payroll creation');
    }
  }

  /**
   * Find payroll by ID with detailed information
   * @param {number} id - Payroll ID
   * @returns {Promise<object>} - Payroll data
   */
  static async findById(id) {
    try {
      const query = `
        SELECT 
          p.*,
          c.name as company_name,
          creator.name as created_by_name,
          processor.name as processed_by_name,
          COUNT(DISTINCT ps.id) as pay_stub_count,
          COUNT(DISTINCT ps.user_id) as employee_count,
          COALESCE(SUM(ps.gross_pay), 0) as total_gross,
          COALESCE(SUM(ps.deductions), 0) as total_deductions,
          COALESCE(SUM(ps.net_pay), 0) as total_net
        FROM payrolls p
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN users creator ON p.created_by = creator.id
        LEFT JOIN users processor ON p.processed_by = processor.id
        LEFT JOIN paystubs ps ON p.id = ps.payroll_id
        WHERE p.id = $1
        GROUP BY p.id, c.name, creator.name, processor.name
      `;
      
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        notFoundError('Payroll');
      }
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to find payroll by ID', { error: error.message, payrollId: id });
      handleDatabaseError(error, 'Payroll lookup');
    }
  }

  /**
   * Calculate payroll for all employees in the company
   * @param {number} id - Payroll ID
   * @returns {Promise<object>} - Payroll calculations
   */
  static async calculatePayroll(id) {
    try {
      const payroll = await this.findById(id);
      
      if (payroll.status !== PAYROLL_STATUS.DRAFT) {
        validationError('Can only calculate payroll in DRAFT status');
      }
      
      // Get all active employees for the company
      const employeesQuery = `
        SELECT 
          u.id, u.name, u.email, u.hourly_rate,
          jr.role_name, jr.hourly_rate as role_hourly_rate, jr.overtime_rate
        FROM users u
        LEFT JOIN jobroles jr ON u.job_role_id = jr.id
        WHERE u.company_id = $1 AND u.is_active = true
      `;
      
      const employeesResult = await db.query(employeesQuery, [payroll.company_id]);
      const employees = employeesResult.rows;
      
      const calculations = [];
      
      for (const employee of employees) {
        const employeeCalc = await this.calculateEmployeePayroll(
          employee,
          payroll.pay_period_start,
          payroll.pay_period_end
        );
        calculations.push(employeeCalc);
      }
      
      const totals = calculations.reduce((acc, calc) => ({
        totalGross: acc.totalGross + calc.grossPay,
        totalDeductions: acc.totalDeductions + calc.deductions,
        totalNet: acc.totalNet + calc.netPay,
        totalHours: acc.totalHours + calc.totalHours,
        totalOvertimeHours: acc.totalOvertimeHours + calc.overtimeHours
      }), {
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalHours: 0,
        totalOvertimeHours: 0
      });
      
      return {
        payroll: payroll,
        employees: calculations,
        totals: totals
      };
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to calculate payroll', { error: error.message, payrollId: id });
      handleDatabaseError(error, 'Payroll calculation');
    }
  }

  /**
   * Calculate individual employee payroll
   * @param {object} employee - Employee data
   * @param {string} startDate - Pay period start
   * @param {string} endDate - Pay period end
   * @returns {Promise<object>} - Employee payroll calculation
   */
  static async calculateEmployeePayroll(employee, startDate, endDate) {
    try {
      // Get time punches for the pay period
      const punchesQuery = `
        SELECT 
          DATE(timestamp) as work_date,
          array_agg(
            json_build_object(
              'punch_type', punch_type,
              'timestamp', timestamp
            ) ORDER BY timestamp
          ) as punches
        FROM timepunches
        WHERE user_id = $1 
        AND DATE(timestamp) BETWEEN $2 AND $3
        GROUP BY DATE(timestamp)
        ORDER BY work_date
      `;
      
      const punchesResult = await db.query(punchesQuery, [employee.id, startDate, endDate]);
      const workDays = punchesResult.rows;
      
      let totalHours = 0;
      let regularHours = 0;
      let overtimeHours = 0;
      
      // Calculate hours for each work day
      for (const day of workDays) {
        const dayHours = this.calculateDayHours(day.punches);
        totalHours += dayHours;
      }
      
      // Calculate overtime (over 40 hours per week or 8 hours per day)
      const weeklyOvertimeHours = Math.max(0, totalHours - TIME_CONSTANTS.OVERTIME_THRESHOLD_HOURS);
      overtimeHours = weeklyOvertimeHours;
      regularHours = totalHours - overtimeHours;
      
      // Use employee's individual rate or role rate
      const hourlyRate = employee.hourly_rate || employee.role_hourly_rate || 0;
      const overtimeRate = employee.overtime_rate || (hourlyRate * 1.5);
      
      // Calculate gross pay
      const regularPay = regularHours * hourlyRate;
      const overtimePay = overtimeHours * overtimeRate;
      const grossPay = regularPay + overtimePay;
      
      // Calculate deductions (basic calculation - could be expanded)
      const federalTax = grossPay * 0.12; // 12% federal tax (simplified)
      const stateTax = grossPay * 0.05; // 5% state tax (simplified)
      const socialSecurity = grossPay * 0.062; // 6.2% Social Security
      const medicare = grossPay * 0.0145; // 1.45% Medicare
      
      const totalDeductions = federalTax + stateTax + socialSecurity + medicare;
      const netPay = grossPay - totalDeductions;
      
      return {
        userId: employee.id,
        userName: employee.name,
        userEmail: employee.email,
        roleName: employee.role_name,
        hourlyRate: hourlyRate,
        overtimeRate: overtimeRate,
        totalHours: Math.round(totalHours * 100) / 100,
        regularHours: Math.round(regularHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        regularPay: Math.round(regularPay * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        grossPay: Math.round(grossPay * 100) / 100,
        deductions: {
          federalTax: Math.round(federalTax * 100) / 100,
          stateTax: Math.round(stateTax * 100) / 100,
          socialSecurity: Math.round(socialSecurity * 100) / 100,
          medicare: Math.round(medicare * 100) / 100,
          total: Math.round(totalDeductions * 100) / 100
        },
        netPay: Math.round(netPay * 100) / 100,
        workDays: workDays.length
      };
    } catch (error) {
      logger.error('Failed to calculate employee payroll', {
        error: error.message,
        employeeId: employee.id
      });
      handleDatabaseError(error, 'Employee payroll calculation');
    }
  }

  /**
   * Calculate hours worked in a single day from punches
   * @param {array} punches - Array of time punches for the day
   * @returns {number} - Hours worked
   */
  static calculateDayHours(punches) {
    let totalMinutes = 0;
    let clockIn = null;
    let onBreak = false;
    
    for (const punch of punches) {
      const timestamp = new Date(punch.timestamp);
      
      switch (punch.punch_type) {
        case 'CLOCK_IN':
          clockIn = timestamp;
          onBreak = false;
          break;
          
        case 'CLOCK_OUT':
          if (clockIn && !onBreak) {
            totalMinutes += (timestamp - clockIn) / (1000 * 60);
          }
          clockIn = null;
          break;
          
        case 'LUNCH_START':
        case 'BREAK_START':
          if (clockIn && !onBreak) {
            totalMinutes += (timestamp - clockIn) / (1000 * 60);
            onBreak = true;
          }
          break;
          
        case 'LUNCH_END':
        case 'BREAK_END':
          if (onBreak) {
            clockIn = timestamp;
            onBreak = false;
          }
          break;
      }
    }
    
    return totalMinutes / 60; // Convert to hours
  }

  /**
   * Process payroll (create pay stubs)
   * @param {number} id - Payroll ID
   * @param {number} processedBy - User ID who processed
   * @returns {Promise<object>} - Processed payroll
   */
  static async processPayroll(id, processedBy) {
    try {
      const payroll = await this.findById(id);
      
      if (payroll.status !== PAYROLL_STATUS.DRAFT) {
        validationError('Can only process payroll in DRAFT status');
      }
      
      // Calculate payroll
      const calculations = await this.calculatePayroll(id);
      
      // Start transaction
      await db.query('BEGIN');
      
      try {
        // Create pay stubs for each employee
        for (const empCalc of calculations.employees) {
          await this.createPayStub(id, empCalc);
        }
        
        // Update payroll status and totals
        const updateQuery = `
          UPDATE payrolls 
          SET 
            status = $2,
            total_cost = $3,
            processed_by = $4,
            processed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `;
        
        const updateResult = await db.query(updateQuery, [
          id,
          PAYROLL_STATUS.COMPLETED,
          calculations.totals.totalNet,
          processedBy
        ]);
        
        await db.query('COMMIT');
        
        logger.info('Payroll processed successfully', {
          payrollId: id,
          employeeCount: calculations.employees.length,
          totalCost: calculations.totals.totalNet
        });
        
        return updateResult.rows[0];
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to process payroll', { error: error.message, payrollId: id });
      handleDatabaseError(error, 'Payroll processing');
    }
  }

  /**
   * Create a pay stub for an employee
   * @param {number} payrollId - Payroll ID
   * @param {object} calculation - Employee calculation data
   * @returns {Promise<object>} - Created pay stub
   */
  static async createPayStub(payrollId, calculation) {
    try {
      const query = `
        INSERT INTO paystubs (
          user_id, payroll_id, gross_pay, deductions, net_pay,
          regular_hours, overtime_hours, hourly_rate, overtime_rate,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const values = [
        calculation.userId,
        payrollId,
        calculation.grossPay,
        calculation.deductions.total,
        calculation.netPay,
        calculation.regularHours,
        calculation.overtimeHours,
        calculation.hourlyRate,
        calculation.overtimeRate
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to create pay stub', {
        error: error.message,
        payrollId,
        userId: calculation.userId
      });
      handleDatabaseError(error, 'Pay stub creation');
    }
  }

  /**
   * Get payrolls by company with filtering and pagination
   * @param {number} companyId - Company ID
   * @param {object} filters - Search filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} - Payrolls with pagination
   */
  static async getByCompany(companyId, filters = {}, pagination = {}) {
    try {
      const { page, limit, offset } = getPagination(pagination.page, pagination.limit);
      const { status, startDate, endDate } = filters;
      
      let whereClause = 'WHERE p.company_id = $1';
      const queryParams = [companyId];
      let paramCounter = 2;
      
      if (status) {
        whereClause += ` AND p.status = $${paramCounter}`;
        queryParams.push(status);
        paramCounter++;
      }
      
      if (startDate) {
        whereClause += ` AND p.pay_period_start >= $${paramCounter}`;
        queryParams.push(startDate);
        paramCounter++;
      }
      
      if (endDate) {
        whereClause += ` AND p.pay_period_end <= $${paramCounter}`;
        queryParams.push(endDate);
        paramCounter++;
      }
      
      // Count total records
      const countQuery = `
        SELECT COUNT(*) as total
        FROM payrolls p
        ${whereClause}
      `;
      
      const countResult = await db.query(countQuery, queryParams);
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          p.*,
          creator.name as created_by_name,
          processor.name as processed_by_name,
          COUNT(DISTINCT ps.id) as pay_stub_count,
          COALESCE(SUM(ps.net_pay), 0) as total_net_pay
        FROM payrolls p
        LEFT JOIN users creator ON p.created_by = creator.id
        LEFT JOIN users processor ON p.processed_by = processor.id
        LEFT JOIN paystubs ps ON p.id = ps.payroll_id
        ${whereClause}
        GROUP BY p.id, creator.name, processor.name
        ORDER BY p.pay_period_start DESC
        LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
      `;
      
      queryParams.push(limit, offset);
      const dataResult = await db.query(dataQuery, queryParams);
      
      return {
        payrolls: dataResult.rows,
        pagination: createPaginationMeta(totalCount, page, limit)
      };
    } catch (error) {
      logger.error('Failed to get payrolls by company', {
        error: error.message,
        companyId,
        filters
      });
      handleDatabaseError(error, 'Payrolls lookup');
    }
  }

  /**
   * Update payroll status
   * @param {number} id - Payroll ID
   * @param {string} status - New status
   * @param {number} updatedBy - User ID who updated
   * @returns {Promise<object>} - Updated payroll
   */
  static async updateStatus(id, status, updatedBy) {
    try {
      if (!Object.values(PAYROLL_STATUS).includes(status)) {
        validationError('Invalid payroll status');
      }
      
      const query = `
        UPDATE payrolls 
        SET 
          status = $2,
          updated_by = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [id, status, updatedBy]);
      
      if (result.rows.length === 0) {
        notFoundError('Payroll');
      }
      
      logger.info('Payroll status updated', {
        payrollId: id,
        newStatus: status,
        updatedBy
      });
      
      return result.rows[0];
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to update payroll status', {
        error: error.message,
        payrollId: id,
        status
      });
      handleDatabaseError(error, 'Payroll status update');
    }
  }

  /**
   * Delete payroll (only if in DRAFT status)
   * @param {number} id - Payroll ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    try {
      const payroll = await this.findById(id);
      
      if (payroll.status !== PAYROLL_STATUS.DRAFT) {
        validationError('Can only delete payroll in DRAFT status');
      }
      
      const query = `
        DELETE FROM payrolls 
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, [id]);
      
      logger.info('Payroll deleted successfully', { payrollId: id });
      
      return true;
    } catch (error) {
      if (error.name === 'AppError') throw error;
      logger.error('Failed to delete payroll', { error: error.message, payrollId: id });
      handleDatabaseError(error, 'Payroll deletion');
    }
  }
}

module.exports = Payroll;
