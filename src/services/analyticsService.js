const logger = require('../utils/logger');
const TimePunch = require('../models/TimePunch');
const User = require('../models/User');
const PayStub = require('../models/PayStub');
const Payroll = require('../models/Payroll');
const { formatDate, calculateWorkingDays } = require('../utils/helpers');

class AnalyticsService {
  /**
   * Get comprehensive dashboard analytics
   * @param {number} companyId - Company ID for filtering
   * @param {string} timeframe - Timeframe (today, week, month, quarter, year)
   * @returns {Object} Dashboard analytics data
   */
  async getDashboardAnalytics(companyId, timeframe = 'month') {
    try {
      const dateRange = this.getDateRange(timeframe);
      
      const [
        employeeMetrics,
        timeTrackingMetrics,
        payrollMetrics,
        productivityMetrics,
        attendanceMetrics
      ] = await Promise.all([
        this.getEmployeeMetrics(companyId, dateRange),
        this.getTimeTrackingMetrics(companyId, dateRange),
        this.getPayrollMetrics(companyId, dateRange),
        this.getProductivityMetrics(companyId, dateRange),
        this.getAttendanceMetrics(companyId, dateRange)
      ]);

      return {
        timeframe,
        dateRange,
        employee: employeeMetrics,
        timeTracking: timeTrackingMetrics,
        payroll: payrollMetrics,
        productivity: productivityMetrics,
        attendance: attendanceMetrics,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting dashboard analytics:', error);
      throw new Error('Failed to generate dashboard analytics');
    }
  }

  /**
   * Get employee-specific analytics
   * @param {number} userId - User ID
   * @param {string} timeframe - Timeframe
   * @returns {Object} Employee analytics
   */
  async getEmployeeAnalytics(userId, timeframe = 'month') {
    try {
      const dateRange = this.getDateRange(timeframe);
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const [
        timeMetrics,
        payrollMetrics,
        attendanceMetrics,
        performanceMetrics
      ] = await Promise.all([
        this.getUserTimeMetrics(userId, dateRange),
        this.getUserPayrollMetrics(userId, dateRange),
        this.getUserAttendanceMetrics(userId, dateRange),
        this.getUserPerformanceMetrics(userId, dateRange)
      ]);

      return {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          department: user.department
        },
        timeframe,
        dateRange,
        time: timeMetrics,
        payroll: payrollMetrics,
        attendance: attendanceMetrics,
        performance: performanceMetrics,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting employee analytics:', error);
      throw new Error('Failed to generate employee analytics');
    }
  }

  /**
   * Get real-time analytics for live dashboard
   * @returns {Object} Real-time metrics
   */
  async getRealTimeAnalytics() {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        currentlyWorking,
        todayPunches,
        recentActivity,
        systemHealth
      ] = await Promise.all([
        this.getCurrentlyWorkingEmployees(),
        this.getTodayTimePunches(),
        this.getRecentActivity(10),
        this.getSystemHealthMetrics()
      ]);

      return {
        timestamp: now.toISOString(),
        currentlyWorking,
        todayPunches,
        recentActivity,
        systemHealth
      };
    } catch (error) {
      logger.error('Error getting real-time analytics:', error);
      throw new Error('Failed to generate real-time analytics');
    }
  }

  /**
   * Get payroll analytics
   * @param {number} companyId - Company ID
   * @param {string} timeframe - Timeframe
   * @returns {Object} Payroll analytics
   */
  async getPayrollAnalytics(companyId, timeframe = 'year') {
    try {
      const dateRange = this.getDateRange(timeframe);
      
      const [
        payrollSummary,
        departmentBreakdown,
        trends,
        costAnalysis
      ] = await Promise.all([
        this.getPayrollSummary(companyId, dateRange),
        this.getPayrollByDepartment(companyId, dateRange),
        this.getPayrollTrends(companyId, dateRange),
        this.getPayrollCostAnalysis(companyId, dateRange)
      ]);

      return {
        timeframe,
        dateRange,
        summary: payrollSummary,
        departmentBreakdown,
        trends,
        costAnalysis,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting payroll analytics:', error);
      throw new Error('Failed to generate payroll analytics');
    }
  }

  /**
   * Get attendance analytics
   * @param {number} companyId - Company ID
   * @param {string} timeframe - Timeframe
   * @returns {Object} Attendance analytics
   */
  async getAttendanceAnalytics(companyId, timeframe = 'month') {
    try {
      const dateRange = this.getDateRange(timeframe);
      
      const [
        attendanceSummary,
        absenteeism,
        punctuality,
        patterns
      ] = await Promise.all([
        this.getAttendanceSummary(companyId, dateRange),
        this.getAbsenteeismAnalysis(companyId, dateRange),
        this.getPunctualityAnalysis(companyId, dateRange),
        this.getAttendancePatterns(companyId, dateRange)
      ]);

      return {
        timeframe,
        dateRange,
        summary: attendanceSummary,
        absenteeism,
        punctuality,
        patterns,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting attendance analytics:', error);
      throw new Error('Failed to generate attendance analytics');
    }
  }

  // Helper Methods

  getDateRange(timeframe) {
    const now = new Date();
    let startDate, endDate = new Date(now);

    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  }

  async getEmployeeMetrics(companyId, dateRange) {
    // Implementation for employee metrics
    const totalEmployees = await User.countByCompany(companyId);
    const activeEmployees = await User.countActiveByCompany(companyId);
    const newHires = await User.countNewHires(companyId, dateRange);
    
    return {
      total: totalEmployees,
      active: activeEmployees,
      inactive: totalEmployees - activeEmployees,
      newHires,
      turnoverRate: await this.calculateTurnoverRate(companyId, dateRange)
    };
  }

  async getTimeTrackingMetrics(companyId, dateRange) {
    const totalHours = await TimePunch.getTotalHours(companyId, dateRange);
    const averageHoursPerEmployee = await TimePunch.getAverageHoursPerEmployee(companyId, dateRange);
    const overtimeHours = await TimePunch.getOvertimeHours(companyId, dateRange);
    
    return {
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerEmployee: Math.round(averageHoursPerEmployee * 100) / 100,
      overtimeHours: Math.round(overtimeHours * 100) / 100,
      regularHours: Math.round((totalHours - overtimeHours) * 100) / 100
    };
  }

  async getPayrollMetrics(companyId, dateRange) {
    const totalPayroll = await PayStub.getTotalPayroll(companyId, dateRange);
    const averagePayPerEmployee = await PayStub.getAveragePayPerEmployee(companyId, dateRange);
    const totalDeductions = await PayStub.getTotalDeductions(companyId, dateRange);
    
    return {
      totalGrossPay: totalPayroll.grossPay,
      totalNetPay: totalPayroll.netPay,
      totalDeductions,
      averagePayPerEmployee,
      payrollCount: totalPayroll.count
    };
  }

  async getCurrentlyWorkingEmployees() {
    return await TimePunch.getCurrentlyWorking();
  }

  async getTodayTimePunches() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return await TimePunch.getTodayStats(startOfDay);
  }

  async getRecentActivity(limit = 10) {
    return await TimePunch.getRecentActivity(limit);
  }

  async getSystemHealthMetrics() {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate trend data for charts
   * @param {Array} data - Raw data points
   * @param {string} timeframe - Timeframe for grouping
   * @returns {Object} Trend data formatted for charts
   */
  generateTrendData(data, timeframe) {
    const trends = {
      labels: [],
      datasets: []
    };

    // Group data by time period
    const groupedData = this.groupDataByTime(data, timeframe);
    
    trends.labels = Object.keys(groupedData).sort();
    trends.datasets = [{
      label: 'Value',
      data: trends.labels.map(label => groupedData[label] || 0),
      borderColor: '#007bff',
      backgroundColor: 'rgba(0, 123, 255, 0.1)',
      tension: 0.1
    }];

    return trends;
  }

  groupDataByTime(data, timeframe) {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.date || item.timestamp || item.createdAt);
      let key;
      
      switch (timeframe) {
        case 'hour':
          key = `${date.getHours()}:00`;
          break;
        case 'day':
          key = formatDate(date);
          break;
        case 'week':
          const week = this.getWeekNumber(date);
          key = `Week ${week}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = formatDate(date);
      }
      
      grouped[key] = (grouped[key] || 0) + (item.value || 1);
    });
    
    return grouped;
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async calculateTurnoverRate(companyId, dateRange) {
    const startEmployees = await User.countByCompanyAtDate(companyId, dateRange.startDate);
    const endEmployees = await User.countByCompanyAtDate(companyId, dateRange.endDate);
    const departures = await User.countDepartures(companyId, dateRange);
    
    const averageEmployees = (startEmployees + endEmployees) / 2;
    return averageEmployees > 0 ? (departures / averageEmployees) * 100 : 0;
  }
}

module.exports = new AnalyticsService();
