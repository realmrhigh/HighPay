const winston = require('winston');
const path = require('path');
const fs = require('fs');
const environment = require('../config/environment');

// Create logs directory if it doesn't exist
const logDir = path.dirname(environment.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: environment.logging.level,
  format: logFormat,
  defaultMeta: { service: 'highpay-backend' },
  transports: [
    // Write all logs to file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: environment.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport for non-production environments
if (!environment.isProduction()) {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Create a stream object for Morgan HTTP request logging
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Utility methods
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  };
  
  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

logger.logError = (error, req = null) => {
  const logData = {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  };

  if (req) {
    logData.request = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      userId: req.user?.id
    };
  }

  logger.error('Application Error', logData);
};

logger.logDatabaseQuery = (query, params, duration) => {
  if (environment.isDevelopment()) {
    logger.debug('Database Query', {
      query: query.replace(/\s+/g, ' ').trim(),
      params,
      duration: `${duration}ms`
    });
  }
};

module.exports = logger;
