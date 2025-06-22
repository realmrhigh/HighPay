const jwt = require('jsonwebtoken');
const logger = require('./logger');

/**
 * Generates a standard access token for a user
 * @param {string} userId - The user's UUID
 * @param {string} email - The user's email address
 * @param {string} roleType - The user's role ('admin', 'manager', 'employee')
 * @returns {string} The generated JWT
 */
const generateToken = (userId, email, roleType) => {
  try {
    return jwt.sign(
      { 
        userId, 
        email, 
        roleType,
        type: 'access'
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'highpay-api',
        audience: 'highpay-client'
      }
    );
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generates a refresh token
 * @param {string} userId - The user's UUID
 * @returns {string} The generated refresh JWT
 */
const generateRefreshToken = (userId) => {
  try {
    return jwt.sign(
      { 
        userId,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
      { 
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer: 'highpay-api',
        audience: 'highpay-client'
      }
    );
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verifies an access token
 * @param {string} token - The JWT token to verify
 * @returns {Object|null} The decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'highpay-api',
      audience: 'highpay-client'
    });
  } catch (error) {
    logger.warn('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Verifies a refresh token
 * @param {string} token - The refresh token to verify
 * @returns {Object|null} The decoded token payload or null if invalid
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh',
      {
        issuer: 'highpay-api',
        audience: 'highpay-client'
      }
    );
    
    // Ensure it's actually a refresh token
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    logger.warn('Refresh token verification failed:', error.message);
    return null;
  }
};

/**
 * Decodes a JWT without verification (useful for getting token info)
 * @param {string} token - The JWT token to decode
 * @returns {Object|null} The decoded token payload or null if invalid
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.warn('Token decode failed:', error.message);
    return null;
  }
};

/**
 * Checks if a token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
};

/**
 * Gets the remaining time until token expires
 * @param {string} token - The JWT token
 * @returns {number} Remaining time in seconds, or 0 if expired/invalid
 */
const getTokenExpirationTime = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return 0;
    }
    
    const remaining = Math.max(0, Math.floor((decoded.exp * 1000 - Date.now()) / 1000));
    return remaining;
  } catch (error) {
    return 0;
  }
};

/**
 * Extracts user ID from token without verification
 * @param {string} token - The JWT token
 * @returns {string|null} User ID or null if not found
 */
const extractUserIdFromToken = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded?.userId || null;
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpirationTime,
  extractUserIdFromToken
};
