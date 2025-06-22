const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { EMAIL_TEMPLATES } = require('../utils/constants');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  async initialize() {
    try {
      if (process.env.NODE_ENV === 'test') {
        // Use ethereal email for testing
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } else if (process.env.EMAIL_SERVICE === 'gmail') {
        // Gmail configuration
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD, // App password for Gmail
          },
        });
      } else if (process.env.EMAIL_SERVICE === 'smtp') {
        // Generic SMTP configuration
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
      } else {
        // Fallback to console logging in development
        this.transporter = {
          sendMail: (mailOptions) => {
            logger.info('Email would be sent:', mailOptions);
            return Promise.resolve({ messageId: 'dev-mode-' + Date.now() });
          }
        };
      }

      this.isInitialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(options) {
    if (!this.isInitialized) {
      throw new Error('Email service not initialized');
    }

    const { to, subject, html, text, attachments } = options;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"HighPay" <noreply@highpay.com>',
      to,
      subject,
      html,
      text,
      attachments
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`, {
        messageId: result.messageId,
        subject
      });
      return result;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   * @param {string} email - User email
   * @param {string} firstName - User first name
   * @param {string} companyName - Company name
   */
  async sendWelcomeEmail(email, firstName, companyName) {
    const subject = `Welcome to HighPay, ${firstName}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to HighPay!</h1>
        <p>Hi ${firstName},</p>
        <p>Welcome to HighPay! Your account has been successfully created for <strong>${companyName}</strong>.</p>
        <p>You can now:</p>
        <ul>
          <li>Track your work hours</li>
          <li>View your pay stubs</li>
          <li>Update your profile information</li>
          <li>And much more!</li>
        </ul>
        <p>If you have any questions, please don't hesitate to reach out to your administrator or our support team.</p>
        <p>Best regards,<br>The HighPay Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `Welcome to HighPay, ${firstName}! Your account has been successfully created for ${companyName}.`
    });
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} resetToken - Password reset token
   * @param {string} firstName - User first name
   */
  async sendPasswordResetEmail(email, resetToken, firstName) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request - HighPay';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your password for your HighPay account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The HighPay Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `Password reset requested. Visit: ${resetUrl} (expires in 1 hour)`
    });
  }

  /**
   * Send payroll notification email
   * @param {string} email - User email
   * @param {string} firstName - User first name
   * @param {Object} payrollData - Payroll information
   */
  async sendPayrollNotification(email, firstName, payrollData) {
    const subject = 'New Pay Stub Available - HighPay';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Pay Stub Available</h1>
        <p>Hi ${firstName},</p>
        <p>Your pay stub for the period <strong>${payrollData.startDate}</strong> to <strong>${payrollData.endDate}</strong> is now available.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Pay Summary</h3>
          <p><strong>Gross Pay:</strong> $${payrollData.grossPay.toFixed(2)}</p>
          <p><strong>Net Pay:</strong> $${payrollData.netPay.toFixed(2)}</p>
          <p><strong>Hours Worked:</strong> ${payrollData.hoursWorked}</p>
        </div>
        <p>You can view and download your complete pay stub by logging into your HighPay account.</p>
        <p>Best regards,<br>The HighPay Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `New pay stub available for ${payrollData.startDate} to ${payrollData.endDate}. Gross: $${payrollData.grossPay.toFixed(2)}, Net: $${payrollData.netPay.toFixed(2)}`
    });
  }

  /**
   * Send account deactivation notification
   * @param {string} email - User email
   * @param {string} firstName - User first name
   */
  async sendAccountDeactivationEmail(email, firstName) {
    const subject = 'Account Deactivated - HighPay';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Account Deactivated</h1>
        <p>Hi ${firstName},</p>
        <p>Your HighPay account has been deactivated by your administrator.</p>
        <p>If you believe this was done in error, please contact your administrator or our support team.</p>
        <p>Best regards,<br>The HighPay Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text: `Your HighPay account has been deactivated. Contact your administrator if you believe this was done in error.`
    });
  }

  /**
   * Send bulk email
   * @param {Array} recipients - Array of email addresses
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @param {string} text - Text content
   */
  async sendBulkEmail(recipients, subject, html, text) {
    const promises = recipients.map(email => 
      this.sendEmail({ to: email, subject, html, text })
    );

    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Bulk email completed: ${successful} successful, ${failed} failed`);
      return { successful, failed, results };
    } catch (error) {
      logger.error('Bulk email failed:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    if (!this.isInitialized) {
      throw new Error('Email service not initialized');
    }

    try {
      if (this.transporter.verify) {
        await this.transporter.verify();
      }
      logger.info('Email service connection test successful');
      return true;
    } catch (error) {
      logger.error('Email service connection test failed:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
