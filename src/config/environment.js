require('dotenv').config();

const environment = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3000,
  HOST: process.env.HOST || 'localhost',

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME || 'highpay_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Firebase configuration
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD
  },

  // File storage
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // API rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  },

  // Environment checks
  isDevelopment: () => environment.NODE_ENV === 'development',
  isProduction: () => environment.NODE_ENV === 'production',
  isTest: () => environment.NODE_ENV === 'test',

  // Validation
  validateRequired: () => {
    const requiredEnvVars = [
      'DB_PASSWORD',
      'JWT_SECRET'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
};

// Validate environment in production
if (environment.isProduction()) {
  environment.validateRequired();
}

module.exports = environment;
