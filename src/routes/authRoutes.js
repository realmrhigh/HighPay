const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { applyRateLimit } = require('../middleware/rateLimiter');
const {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateRefreshToken
} = require('../validators/authValidators');

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register',
  applyRateLimit('auth_register'),
  validateRegistration,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login',
  applyRateLimit('auth_login'),
  validateLogin,
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  applyRateLimit('auth_refresh'),
  validateRefreshToken,
  authController.refreshToken
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  applyRateLimit('password_change'),
  validatePasswordChange,
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate token)
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password',
  applyRateLimit('password_reset'),
  validatePasswordResetRequest,
  authController.requestPasswordReset
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post('/reset-password',
  applyRateLimit('password_reset'),
  validatePasswordReset,
  authController.resetPassword
);

module.exports = router;
