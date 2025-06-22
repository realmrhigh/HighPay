const jwt = require('jsonwebtoken');

const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // Password requirements
  password: {
    minLength: 6,
    requireNumbers: true,
    requireUppercase: false,
    requireLowercase: true,
    requireSpecialChars: false
  },

  // Session configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    sameSite: 'strict'
  },

  // Rate limiting for auth endpoints
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5, // 5 attempts per window
    blockDuration: 15 * 60 * 1000 // Block for 15 minutes after max attempts
  }
};

// Utility functions
const generateToken = (payload) => {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, authConfig.jwtSecret);
};

module.exports = {
  ...authConfig,
  generateToken,
  verifyToken
};
