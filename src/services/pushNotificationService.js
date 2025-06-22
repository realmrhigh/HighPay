const admin = require('firebase-admin');
const logger = require('../utils/logger');

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initialize() {
    try {
      if (process.env.NODE_ENV === 'test') {
        // Skip Firebase initialization in test environment
        this.isInitialized = false;
        return;
      }

      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        logger.warn('Firebase service account key not found. Push notifications disabled.');
        return;
      }

      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL
        });
      }

      this.messaging = admin.messaging();
      this.isInitialized = true;
      logger.info('Push notification service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize push notification service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Send push notification to a single device
   * @param {string} token - Device token
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data
   */
  async sendToDevice(token, notification, data = {}) {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return null;
    }

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data: {
        ...data,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    try {
      const response = await this.messaging.send(message);
      logger.info(`Push notification sent successfully to device: ${token}`, {
        messageId: response,
        title: notification.title
      });
      return response;
    } catch (error) {
      logger.error(`Failed to send push notification to device: ${token}`, error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {Array} tokens - Array of device tokens
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data
   */
  async sendToMultipleDevices(tokens, notification, data = {}) {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return null;
    }

    if (tokens.length === 0) {
      logger.warn('No device tokens provided for push notification');
      return null;
    }

    const message = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data: {
        ...data,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    try {
      const response = await this.messaging.sendMulticast(message);
      logger.info(`Push notification sent to ${response.successCount}/${tokens.length} devices`, {
        successCount: response.successCount,
        failureCount: response.failureCount,
        title: notification.title
      });

      // Log failed tokens for debugging
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            logger.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          }
        });
      }

      return response;
    } catch (error) {
      logger.error('Failed to send multicast push notification:', error);
      throw error;
    }
  }

  /**
   * Send notification to a topic
   * @param {string} topic - Topic name
   * @param {Object} notification - Notification data
   * @param {Object} data - Additional data
   */
  async sendToTopic(topic, notification, data = {}) {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return null;
    }

    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl
      },
      data: {
        ...data,
        timestamp: Date.now().toString()
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'default',
          sound: 'default',
          priority: 'high'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    try {
      const response = await this.messaging.send(message);
      logger.info(`Push notification sent to topic: ${topic}`, {
        messageId: response,
        title: notification.title
      });
      return response;
    } catch (error) {
      logger.error(`Failed to send push notification to topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Subscribe device tokens to a topic
   * @param {Array} tokens - Device tokens
   * @param {string} topic - Topic name
   */
  async subscribeToTopic(tokens, topic) {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return null;
    }

    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      logger.info(`Subscribed ${response.successCount}/${tokens.length} devices to topic: ${topic}`);
      return response;
    } catch (error) {
      logger.error(`Failed to subscribe devices to topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe device tokens from a topic
   * @param {Array} tokens - Device tokens
   * @param {string} topic - Topic name
   */
  async unsubscribeFromTopic(tokens, topic) {
    if (!this.isInitialized) {
      logger.warn('Push notification service not initialized');
      return null;
    }

    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      logger.info(`Unsubscribed ${response.successCount}/${tokens.length} devices from topic: ${topic}`);
      return response;
    } catch (error) {
      logger.error(`Failed to unsubscribe devices from topic: ${topic}`, error);
      throw error;
    }
  }

  /**
   * Send punch notification (clock in/out)
   * @param {Array} tokens - Device tokens
   * @param {Object} punchData - Punch data
   */
  async sendPunchNotification(tokens, punchData) {
    const notification = {
      title: 'Time Punch Recorded',
      body: `You have successfully ${punchData.type === 'in' ? 'clocked in' : 'clocked out'} at ${punchData.time}`,
    };

    const data = {
      type: 'punch',
      punchType: punchData.type,
      timestamp: punchData.timestamp.toString(),
      userId: punchData.userId
    };

    return this.sendToMultipleDevices(tokens, notification, data);
  }

  /**
   * Send payroll notification
   * @param {Array} tokens - Device tokens
   * @param {Object} payrollData - Payroll data
   */
  async sendPayrollNotification(tokens, payrollData) {
    const notification = {
      title: 'New Pay Stub Available',
      body: `Your pay stub for ${payrollData.period} is ready to view`,
    };

    const data = {
      type: 'payroll',
      payrollId: payrollData.id,
      period: payrollData.period,
      amount: payrollData.netPay.toString()
    };

    return this.sendToMultipleDevices(tokens, notification, data);
  }

  /**
   * Send schedule notification
   * @param {Array} tokens - Device tokens
   * @param {Object} scheduleData - Schedule data
   */
  async sendScheduleNotification(tokens, scheduleData) {
    const notification = {
      title: 'Schedule Update',
      body: scheduleData.message || 'Your work schedule has been updated',
    };

    const data = {
      type: 'schedule',
      scheduleId: scheduleData.id,
      date: scheduleData.date,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime
    };

    return this.sendToMultipleDevices(tokens, notification, data);
  }

  /**
   * Send company-wide announcement
   * @param {string} companyId - Company ID
   * @param {Object} announcement - Announcement data
   */
  async sendCompanyAnnouncement(companyId, announcement) {
    const topic = `company_${companyId}`;
    
    const notification = {
      title: announcement.title || 'Company Announcement',
      body: announcement.message,
    };

    const data = {
      type: 'announcement',
      companyId,
      priority: announcement.priority || 'normal'
    };

    return this.sendToTopic(topic, notification, data);
  }

  /**
   * Validate device token
   * @param {string} token - Device token to validate
   */
  async validateToken(token) {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Try to send a test message to validate the token
      await this.messaging.send({
        token,
        data: { test: 'true' }
      }, true); // dry run
      return true;
    } catch (error) {
      logger.warn(`Invalid device token: ${token}`, error.message);
      return false;
    }
  }
}

module.exports = new PushNotificationService();
