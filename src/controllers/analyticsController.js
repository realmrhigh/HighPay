const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

/**
 * Get dashboard analytics
 */
const getDashboardAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    const companyId = req.user.companyId || 1; // Default company if not set
    
    const analytics = await analyticsService.getDashboardAnalytics(companyId, timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
    
    logger.info(`Dashboard analytics generated for company ${companyId}, timeframe: ${timeframe}`);
  } catch (error) {
    logger.error('Error getting dashboard analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard analytics'
    });
  }
};

/**
 * Get employee-specific analytics
 */
const getEmployeeAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe = 'month' } = req.query;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Check authorization
    if (userRole !== 'admin' && userRole !== 'manager' && parseInt(id) !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const analytics = await analyticsService.getEmployeeAnalytics(parseInt(id), timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
    
    logger.info(`Employee analytics generated for user ${id}, timeframe: ${timeframe}`);
  } catch (error) {
    logger.error('Error getting employee analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate employee analytics'
    });
  }
};

/**
 * Get real-time analytics for live dashboard
 */
const getRealTimeAnalytics = async (req, res) => {
  try {
    const analytics = await analyticsService.getRealTimeAnalytics();
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Error getting real-time analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate real-time analytics'
    });
  }
};

/**
 * Get payroll analytics
 */
const getPayrollAnalytics = async (req, res) => {
  try {
    const { timeframe = 'year' } = req.query;
    const companyId = req.user.companyId || 1;
    
    const analytics = await analyticsService.getPayrollAnalytics(companyId, timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
    
    logger.info(`Payroll analytics generated for company ${companyId}, timeframe: ${timeframe}`);
  } catch (error) {
    logger.error('Error getting payroll analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate payroll analytics'
    });
  }
};

/**
 * Get attendance analytics
 */
const getAttendanceAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;
    const companyId = req.user.companyId || 1;
    
    const analytics = await analyticsService.getAttendanceAnalytics(companyId, timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
    
    logger.info(`Attendance analytics generated for company ${companyId}, timeframe: ${timeframe}`);
  } catch (error) {
    logger.error('Error getting attendance analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate attendance analytics'
    });
  }
};

/**
 * Get time tracking analytics with trends
 */
const getTimeTrackingAnalytics = async (req, res) => {
  try {
    const { timeframe = 'month', userId } = req.query;
    const companyId = req.user.companyId || 1;
    const currentUserId = req.user.userId;
    const userRole = req.user.role;
    
    // Check authorization for specific user analytics
    if (userId && userRole !== 'admin' && userRole !== 'manager' && parseInt(userId) !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    const analytics = userId 
      ? await analyticsService.getEmployeeAnalytics(parseInt(userId), timeframe)
      : await analyticsService.getDashboardAnalytics(companyId, timeframe);
    
    res.json({
      success: true,
      data: analytics
    });
    
    logger.info(`Time tracking analytics generated for ${userId ? `user ${userId}` : `company ${companyId}`}`);
  } catch (error) {
    logger.error('Error getting time tracking analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate time tracking analytics'
    });
  }
};

/**
 * Get productivity metrics
 */
const getProductivityMetrics = async (req, res) => {
  try {
    const { timeframe = 'month', departmentId } = req.query;
    const companyId = req.user.companyId || 1;
    
    // This would be implemented with more detailed productivity tracking
    const mockProductivityData = {
      timeframe,
      companyId,
      departmentId,
      metrics: {
        averageProductivityScore: 85.5,
        taskCompletionRate: 92.3,
        efficiencyTrend: 'increasing',
        topPerformers: [
          { userId: 1, name: 'John Doe', score: 95.2 },
          { userId: 2, name: 'Jane Smith', score: 93.8 },
          { userId: 3, name: 'Mike Johnson', score: 91.4 }
        ],
        departmentComparison: [
          { department: 'Engineering', score: 88.5 },
          { department: 'Sales', score: 85.2 },
          { department: 'Marketing', score: 83.7 }
        ]
      },
      generatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: mockProductivityData
    });
    
    logger.info(`Productivity metrics generated for company ${companyId}`);
  } catch (error) {
    logger.error('Error getting productivity metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate productivity metrics'
    });
  }
};

/**
 * Get custom analytics report
 */
const getCustomReport = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      metrics = [], 
      groupBy = 'day',
      filters = {}
    } = req.body;
    
    const companyId = req.user.companyId || 1;
    const userRole = req.user.role;
    
    // Only admin and managers can generate custom reports
    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied - Admin or Manager role required'
      });
    }
    
    // Validate date range
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }
    
    const customReport = {
      reportId: `custom_${Date.now()}`,
      companyId,
      dateRange: { startDate, endDate },
      metrics: metrics.length > 0 ? metrics : ['hours', 'attendance', 'payroll'],
      groupBy,
      filters,
      data: {
        summary: {
          totalRecords: 1250,
          dateRange: `${startDate} to ${endDate}`,
          metricsIncluded: metrics.length > 0 ? metrics : ['hours', 'attendance', 'payroll']
        },
        chartData: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Hours Worked',
              data: [320, 285, 298, 340],
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)'
            },
            {
              label: 'Attendance Rate',
              data: [95, 92, 94, 96],
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgba(75, 192, 192, 1)'
            }
          ]
        },
        insights: [
          'Average weekly hours increased by 8% compared to previous period',
          'Attendance rate remained consistently above 90%',
          'Peak productivity observed on Tuesdays and Wednesdays'
        ]
      },
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.userId
    };
    
    res.json({
      success: true,
      data: customReport
    });
    
    logger.info(`Custom report generated by user ${req.user.userId} for company ${companyId}`);
  } catch (error) {
    logger.error('Error generating custom report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate custom report'
    });
  }
};

/**
 * Export analytics data
 */
const exportAnalytics = async (req, res) => {
  try {
    const { type, format = 'json', timeframe = 'month' } = req.query;
    const companyId = req.user.companyId || 1;
    
    let analyticsData;
    
    switch (type) {
      case 'dashboard':
        analyticsData = await analyticsService.getDashboardAnalytics(companyId, timeframe);
        break;
      case 'payroll':
        analyticsData = await analyticsService.getPayrollAnalytics(companyId, timeframe);
        break;
      case 'attendance':
        analyticsData = await analyticsService.getAttendanceAnalytics(companyId, timeframe);
        break;
      default:
        analyticsData = await analyticsService.getDashboardAnalytics(companyId, timeframe);
    }
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(analyticsData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics-${timeframe}.csv"`);
      res.send(csv);
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-analytics-${timeframe}.json"`);
      res.json(analyticsData);
    }
    
    logger.info(`Analytics data exported: type=${type}, format=${format}, timeframe=${timeframe}`);
  } catch (error) {
    logger.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data'
    });
  }
};

/**
 * Helper function to convert data to CSV
 */
function convertToCSV(data) {
  // Simple CSV conversion - in production, use a proper CSV library
  const flatten = (obj, prefix = '') => {
    const flattened = {};
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(flattened, flatten(obj[key], prefix + key + '_'));
      } else {
        flattened[prefix + key] = Array.isArray(obj[key]) ? obj[key].join(';') : obj[key];
      }
    }
    return flattened;
  };
  
  const flattened = flatten(data);
  const headers = Object.keys(flattened);
  const values = Object.values(flattened);
  
  return headers.join(',') + '\n' + values.join(',');
}

module.exports = {
  getDashboardAnalytics,
  getEmployeeAnalytics,
  getRealTimeAnalytics,
  getPayrollAnalytics,
  getAttendanceAnalytics,
  getTimeTrackingAnalytics,
  getProductivityMetrics,
  getCustomReport,
  exportAnalytics
};
