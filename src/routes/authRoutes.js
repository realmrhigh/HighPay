const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  authLimiter, 
  registrationLimiter, 
  passwordResetLimiter 
} = require('../middleware/rateLimiter');
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
  registrationLimiter,
  validateRegistration,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login',
  authLimiter,
  validateLogin,
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh',
  authLimiter,
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
  authLimiter,
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
  passwordResetLimiter,
  validatePasswordResetRequest,
  authController.requestPasswordReset
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 */
router.post('/reset-password',
  passwordResetLimiter,
  validatePasswordReset,
  authController.resetPassword
);

module.exports = router;
