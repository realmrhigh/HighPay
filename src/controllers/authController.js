const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createResponse, createErrorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async register(req, res) {
    try {
      const { email, password, firstName, lastName, companyId, jobRoleId } = req.body;

      // Check if user already exists
      const existingUser = await User.getByEmail(email);
      if (existingUser) {
        return res.status(409).json(
          createErrorResponse('An account with this email address already exists', 'EMAIL_EXISTS')
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user data (default role: employee for registration)
      const userData = {
        email,
        passwordHash,
        firstName,
        lastName,
        companyId,
        jobRoleId,
        roleType: 'employee' // Default role for self-registration
      };

      const newUser = await User.create(userData);
      const token = generateToken(newUser.id, newUser.email, newUser.role_type);
      const refreshToken = generateRefreshToken(newUser.id);

      logger.info(`New user registered: ${newUser.email}`, {
        userId: newUser.id,
        companyId
      });

      res.status(201).json(createResponse({
        token,
        refreshToken,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          role: newUser.role_type,
          companyId,
          createdAt: newUser.created_at
        }
      }));
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json(
        createErrorResponse('An unexpected error occurred during registration', 'SERVER_ERROR')
      );
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user with company and job role info
      const user = await User.getByEmailWithDetails(email);
      if (!user || !user.is_active) {
        return res.status(401).json(
          createErrorResponse('Invalid email or password', 'INVALID_CREDENTIALS')
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json(
          createErrorResponse('Invalid email or password', 'INVALID_CREDENTIALS')
        );
      }

      // Generate tokens
      const token = generateToken(user.id, user.email, user.role_type);
      const refreshToken = generateRefreshToken(user.id);

      // Update last login timestamp
      await User.updateLastLogin(user.id);

      logger.info(`User logged in: ${user.email}`, {
        userId: user.id,
        companyId: user.company_id,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      res.json(createResponse({
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role_type,
          companyId: user.company_id,
          companyName: user.company_name,
          jobTitle: user.job_title,
          isActive: user.is_active
        }
      }));
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json(
        createErrorResponse('An unexpected error occurred during login', 'SERVER_ERROR')
      );
    }
  }

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json(
          createErrorResponse('Refresh token is required', 'MISSING_REFRESH_TOKEN')
        );
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return res.status(401).json(
          createErrorResponse('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN')
        );
      }

      // Get user to ensure they still exist and are active
      const user = await User.getById(decoded.userId);
      if (!user || !user.is_active) {
        return res.status(401).json(
          createErrorResponse('User not found or deactivated', 'USER_NOT_FOUND')
        );
      }

      // Generate new tokens
      const newToken = generateToken(user.id, user.email, user.role_type);
      const newRefreshToken = generateRefreshToken(user.id);

      res.json(createResponse({
        token: newToken,
        refreshToken: newRefreshToken
      }));
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json(
        createErrorResponse('Failed to refresh token', 'SERVER_ERROR')
      );
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfile(req, res) {
    try {
      // User data is already available from auth middleware
      const userData = {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.first_name,
        lastName: req.user.last_name,
        role: req.user.role_type,
        companyId: req.user.company_id,
        companyName: req.user.company_name,
        jobTitle: req.user.job_title,
        phone: req.user.phone,
        address: req.user.address,
        hireDate: req.user.hire_date,
        isActive: req.user.is_active,
        createdAt: req.user.created_at,
        lastLoginAt: req.user.last_login_at
      };

      res.json(createResponse({ user: userData }));
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json(
        createErrorResponse('Failed to fetch user profile', 'SERVER_ERROR')
      );
    }
  }

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user's current password hash
      const user = await User.getById(userId);
      if (!user) {
        return res.status(404).json(
          createErrorResponse('User not found', 'USER_NOT_FOUND')
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json(
          createErrorResponse('Current password is incorrect', 'INVALID_CURRENT_PASSWORD')
        );
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await User.update(userId, { passwordHash: newPasswordHash });

      logger.info(`Password changed for user: ${user.email}`, {
        userId,
        ip: req.ip
      });

      res.json(createResponse({ message: 'Password changed successfully' }));
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json(
        createErrorResponse('Failed to change password', 'SERVER_ERROR')
      );
    }
  }

  /**
   * Logout user (placeholder for token blacklisting)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async logout(req, res) {
    try {
      // In a production system, you would typically:
      // 1. Add the token to a blacklist
      // 2. Clear any refresh tokens from the database
      // 3. Clear session data if using sessions
      
      logger.info(`User logged out: ${req.user.email}`, {
        userId: req.user.id
      });

      res.json(createResponse({ message: 'Logged out successfully' }));
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json(
        createErrorResponse('Failed to logout', 'SERVER_ERROR')
      );
    }
  }

  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      const user = await User.getByEmail(email);
      if (!user) {
        // Don't reveal whether the email exists or not
        return res.json(createResponse({
          message: 'If an account with that email exists, a password reset link has been sent'
        }));
      }

      // Generate password reset token
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password_reset' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // TODO: Send password reset email with resetToken
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      logger.info(`Password reset requested for: ${email}`, {
        userId: user.id
      });

      res.json(createResponse({
        message: 'If an account with that email exists, a password reset link has been sent'
      }));
    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json(
        createErrorResponse('Failed to process password reset request', 'SERVER_ERROR')
      );
    }
  }

  /**
   * Reset password with token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.purpose !== 'password_reset') {
          throw new Error('Invalid token purpose');
        }
      } catch (error) {
        return res.status(400).json(
          createErrorResponse('Invalid or expired reset token', 'INVALID_RESET_TOKEN')
        );
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      await User.update(decoded.userId, { passwordHash: newPasswordHash });

      logger.info(`Password reset completed for user: ${decoded.userId}`);

      res.json(createResponse({ message: 'Password reset successfully' }));
    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json(
        createErrorResponse('Failed to reset password', 'SERVER_ERROR')
      );
    }
  }
}

module.exports = new AuthController();
