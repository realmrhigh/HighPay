const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_CODES, RATE_LIMITS } = require('../utils/constants');

/**
 * Create a rate limiter with custom options
 * @param {object} options - Rate limiting options
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: RATE_LIMITS.API.WINDOW_MS,
    max: RATE_LIMITS.API.MAX_REQUESTS,
    message: {
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: 'Too many requests. Please try again later.'
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id
      });

      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json(options.message || defaultOptions.message);
    },
    skip: (req) => {
      // Skip rate limiting for certain conditions
      if (process.env.NODE_ENV === 'test') {
        return true;
      }
      
      // Skip for internal health checks
      if (req.path === '/health' || req.path === '/ping') {
        return true;
      }
      
      return false;
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id ? `user:${req.user.id}` : req.ip;
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * General API rate limiter
 */
const apiLimiter = createRateLimiter({
  windowMs: RATE_LIMITS.API.WINDOW_MS,
  max: RATE_LIMITS.API.MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many API requests. Please try again in 15 minutes.'
    }
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = createRateLimiter({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX_ATTEMPTS,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    }
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false // Count failed requests
});

/**
 * Rate limiter for file upload endpoints
 */
const uploadLimiter = createRateLimiter({
  windowMs: RATE_LIMITS.FILE_UPLOAD.WINDOW_MS,
  max: RATE_LIMITS.FILE_UPLOAD.MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many file uploads. Please try again in a moment.'
    }
  }
});

/**
 * Rate limiter for password reset attempts
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many password reset attempts. Please try again in an hour.'
    }
  },
  keyGenerator: (req) => {
    // Rate limit by email address for password resets
    return req.body.email || req.ip;
  }
});

/**
 * Rate limiter for creating new accounts
 */
const registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many registration attempts. Please try again in an hour.'
    }
  }
});

/**
 * Lenient rate limiter for read-only operations
 */
const readOnlyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests. Please try again later.'
    }
  }
});

/**
 * Progressive rate limiter that increases restrictions for repeat offenders
 */
const progressiveLimiter = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  
  // This would typically use Redis or another store for persistence
  // For now, using a simple in-memory approach (not suitable for production clusters)
  if (!progressiveLimiter.attempts) {
    progressiveLimiter.attempts = new Map();
  }
  
  const attempts = progressiveLimiter.attempts.get(key) || { count: 0, firstAttempt: now };
  
  // Reset if more than 24 hours have passed
  if (now - attempts.firstAttempt > 24 * 60 * 60 * 1000) {
    attempts.count = 0;
    attempts.firstAttempt = now;
  }
  
  attempts.count++;
  progressiveLimiter.attempts.set(key, attempts);
  
  // Progressive limits based on attempt count
  let maxRequests = 100; // Base limit
  let windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (attempts.count > 1000) {
    maxRequests = 10;
    windowMs = 60 * 60 * 1000; // 1 hour
  } else if (attempts.count > 500) {
    maxRequests = 25;
    windowMs = 30 * 60 * 1000; // 30 minutes
  } else if (attempts.count > 200) {
    maxRequests = 50;
  }
  
  // Apply the calculated rate limit
  const dynamicLimiter = createRateLimiter({
    windowMs,
    max: maxRequests,
    message: {
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
        message: `Rate limit applied due to high usage. Limit: ${maxRequests} requests per ${Math.round(windowMs / 60000)} minutes.`
      }
    }
  });
  
  dynamicLimiter(req, res, next);
};

module.exports = {
  createRateLimiter,
  apiLimiter,
  authLimiter,
  uploadLimiter,
  passwordResetLimiter,
  registrationLimiter,
  readOnlyLimiter,
  progressiveLimiter
};
