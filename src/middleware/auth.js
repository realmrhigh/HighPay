const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES, USER_ROLES } = require('../utils/constants');

/**
 * Middleware to authenticate a user via JWT.
 * Verifies the token, checks if the user exists and is active,
 * and attaches the full user object to the request.
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expects "Bearer TOKEN"

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: ERROR_CODES.TOKEN_INVALID,
        message: 'Access token is required for authentication.'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure the user associated with the token still exists and is active
    const userResult = await db.query(`
      SELECT 
        u.id, u.company_id, u.name, u.email, u.permission_role, u.job_role_id, u.created_at,
        c.name as company_name, 
        jr.role_name as job_title,
        jr.hourly_rate, jr.overtime_rate
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN jobroles jr ON u.job_role_id = jr.id
      WHERE u.id = $1
    `, [decoded.userId]);

    if (userResult.rows.length === 0) {
      logger.warn('Authentication failed: User not found', { userId: decoded.userId });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: ERROR_CODES.TOKEN_INVALID,
          message: 'User not found or has been deactivated.'
        }
      });
    }

    // Attach user data to the request object for downstream handlers
    req.user = userResult.rows[0];
    logger.debug('User authenticated successfully', { userId: req.user.id, email: req.user.email });
    next();
  } catch (error) {
    logger.warn('Authentication failed: Invalid token', { error: error.message });
    
    let errorCode = ERROR_CODES.TOKEN_INVALID;
    let message = 'Invalid or expired access token.';
    
    if (error.name === 'TokenExpiredError') {
      errorCode = ERROR_CODES.TOKEN_EXPIRED;
      message = 'Access token has expired.';
    }
    
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: errorCode,
        message: message
      }
    });
  }
};

/**
 * Middleware to require specific roles.
 * Must be used after authenticateToken middleware.
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.error('requireRole middleware used without authentication');
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Authentication required before role check.'
        }
      });
    }

    const userRole = req.user.permission_role;
    
    // Convert legacy role names
    const normalizedRole = userRole === USER_ROLES.HEAD_MANAGEMENT ? USER_ROLES.ADMIN : userRole;
    
    if (!allowedRoles.includes(normalizedRole)) {
      logger.warn('Access denied: Insufficient permissions', {
        userId: req.user.id,
        userRole: normalizedRole,
        requiredRoles: allowedRoles
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
          message: 'You do not have permission to perform this action.'
        }
      });
    }

    next();
  };
};

/**
 * Middleware to check if user belongs to the same company as the resource
 * @param {string} resourceCompanyIdField - Field name for company ID in request params/body
 */
const requireSameCompany = (resourceCompanyIdField = 'companyId') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Authentication required before company check.'
        }
      });
    }

    const resourceCompanyId = req.params[resourceCompanyIdField] || req.body[resourceCompanyIdField];
    
    if (resourceCompanyId && parseInt(resourceCompanyId) !== req.user.company_id) {
      logger.warn('Access denied: Company mismatch', {
        userId: req.user.id,
        userCompanyId: req.user.company_id,
        resourceCompanyId: resourceCompanyId
      });
      
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED_ACCESS,
          message: 'You can only access resources from your own company.'
        }
      });
    }

    next();
  };
};

/**
 * Middleware to check if user can access another user's resources
 * Employees can only access their own data, managers and admins can access all company data
 */
const requireUserAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Authentication required before user access check.'
      }
    });
  }

  const targetUserId = req.params.userId || req.params.id;
  const userRole = req.user.permission_role === USER_ROLES.HEAD_MANAGEMENT ? USER_ROLES.ADMIN : req.user.permission_role;
  
  // Admins and managers can access any user in their company
  if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.MANAGER) {
    // Verify the target user belongs to the same company
    if (targetUserId) {
      try {
        const result = await db.query(
          'SELECT company_id FROM users WHERE id = $1',
          [targetUserId]
        );
        
        if (result.rows.length === 0) {
          return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            error: {
              code: ERROR_CODES.RECORD_NOT_FOUND,
              message: 'User not found.'
            }
          });
        }
        
        if (result.rows[0].company_id !== req.user.company_id) {
          return res.status(HTTP_STATUS.FORBIDDEN).json({
            success: false,
            error: {
              code: ERROR_CODES.UNAUTHORIZED_ACCESS,
              message: 'You can only access users from your own company.'
            }
          });
        }
      } catch (error) {
        logger.error('Database error in user access check', error);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: {
            code: ERROR_CODES.DATABASE_ERROR,
            message: 'Database error occurred.'
          }
        });
      }
    }
    return next();
  }
  
  // Employees can only access their own data
  if (targetUserId && parseInt(targetUserId) !== req.user.id) {
    logger.warn('Access denied: Employee trying to access other user data', {
      userId: req.user.id,
      targetUserId: targetUserId
    });
    
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: {
        code: ERROR_CODES.UNAUTHORIZED_ACCESS,
        message: 'You can only access your own data.'
      }
    });
  }

  next();
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * Useful for endpoints that can work with or without authentication
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without setting req.user
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await db.query(`
      SELECT 
        u.id, u.company_id, u.name, u.email, u.permission_role, u.job_role_id,
        c.name as company_name, 
        jr.role_name as job_title
      FROM users u
      LEFT JOIN companies c ON u.company_id = c.id
      LEFT JOIN jobroles jr ON u.job_role_id = jr.id
      WHERE u.id = $1
    `, [decoded.userId]);

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }
  } catch (error) {
    // Silently fail - just continue without setting req.user
    logger.debug('Optional auth failed', { error: error.message });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireSameCompany,
  requireUserAccess,
  optionalAuth
};
