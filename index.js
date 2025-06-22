require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import configurations and utilities
const { loadEnvironment } = require('./src/config/environment');
const { connectDatabase } = require('./src/config/database');
const logger = require('./src/utils/logger');
const { createResponse } = require('./src/utils/helpers');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { applyRateLimit } = require('./src/middleware/rateLimiter');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const jobRoleRoutes = require('./src/routes/jobRoleRoutes');
// TODO: Import other routes as they are created

// Load and validate environment
loadEnvironment();

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
}));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json(createResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  }));
});

// API documentation redirect
app.get('/api', (req, res) => {
  res.json(createResponse({
    message: 'HighPay API v1.0',
    documentation: '/api/docs',
    version: '1.0.0',    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      jobRoles: '/api/v1/job-roles',
      // TODO: Add other endpoints as they are implemented
    }
  }));
});

// Root endpoint
app.get('/', (req, res) => {
  res.json(createResponse({
    message: 'Welcome to HighPay Backend API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  }));
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/job-roles', jobRoleRoutes);
// TODO: Add other route imports as they are created
// app.use('/api/v1/companies', companyRoutes);
// app.use('/api/v1/time-tracking', timeTrackingRoutes);
// app.use('/api/v1/payroll', payrollRoutes);
// app.use('/api/v1/pay-stubs', payStubRoutes);

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      availableEndpoints: [
        'GET /',
        'GET /health',
        'GET /api',
        'POST /api/v1/auth/login',
        'POST /api/v1/auth/register',
        'GET /api/v1/users'
      ]
    }
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Start server function
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start server
    const server = app.listen(port, () => {
      logger.info(`🚀 HighPay server listening on port ${port}`, {
        environment: process.env.NODE_ENV,
        port,
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connections, cleanup services, etc.
        try {
          // TODO: Add cleanup for database, Redis, etc.
          logger.info('Cleanup completed successfully');
          process.exit(0);
        } catch (error) {
          logger.error('Error during cleanup:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions and unhandled rejections
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
