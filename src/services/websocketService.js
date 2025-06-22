const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { JWT_SECRET } = require('./environment');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.rooms = new Map(); // roomId -> Set of userIds
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    logger.info('WebSocket server initialized');
  }

  /**
   * Verify client authentication
   */
  verifyClient(info) {
    try {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) {
        return false;
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      info.req.user = decoded;
      return true;
    } catch (error) {
      logger.warn('WebSocket authentication failed:', error.message);
      return false;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    logger.info(`WebSocket client connected: User ${userId}`);

    // Store client connection
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Add user to appropriate rooms based on role
    this.addUserToRooms(userId, userRole);

    // Handle messages
    ws.on('message', (data) => {
      this.handleMessage(ws, userId, data);
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(userId, ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
    });

    // Send welcome message
    this.sendToUser(userId, {
      type: 'connection',
      message: 'Connected to HighPay real-time service',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle incoming messages from clients
   */
  handleMessage(ws, userId, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'ping':
          this.sendToConnection(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        case 'join_room':
          this.joinRoom(userId, message.roomId);
          break;
          
        case 'leave_room':
          this.leaveRoom(userId, message.roomId);
          break;
          
        case 'time_punch_update':
          this.handleTimePunchUpdate(userId, message.data);
          break;
          
        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Error handling WebSocket message from user ${userId}:`, error);
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(userId, ws) {
    logger.info(`WebSocket client disconnected: User ${userId}`);
    
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.clients.delete(userId);
        this.removeUserFromAllRooms(userId);
      }
    }
  }

  /**
   * Add user to appropriate rooms based on role
   */
  addUserToRooms(userId, role) {
    // All users join the general room
    this.joinRoom(userId, 'general');
    
    // Managers and admins join management room
    if (role === 'manager' || role === 'admin') {
      this.joinRoom(userId, 'management');
    }
    
    // Admins join admin room
    if (role === 'admin') {
      this.joinRoom(userId, 'admin');
    }
  }

  /**
   * Join a room
   */
  joinRoom(userId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);
    
    logger.debug(`User ${userId} joined room ${roomId}`);
  }

  /**
   * Leave a room
   */
  leaveRoom(userId, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    
    logger.debug(`User ${userId} left room ${roomId}`);
  }

  /**
   * Remove user from all rooms
   */
  removeUserFromAllRooms(userId) {
    for (const [roomId, users] of this.rooms.entries()) {
      users.delete(userId);
      if (users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  /**
   * Send message to a specific user
   */
  sendToUser(userId, message) {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      const messageStr = JSON.stringify(message);
      userConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  }

  /**
   * Send message to a specific connection
   */
  sendToConnection(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send message to all users in a room
   */
  sendToRoom(roomId, message) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.forEach(userId => {
        this.sendToUser(userId, message);
      });
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  /**
   * Handle time punch updates
   */
  handleTimePunchUpdate(userId, data) {
    // Broadcast to management room for real-time monitoring
    this.sendToRoom('management', {
      type: 'time_punch_update',
      userId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about new time punch
   */
  notifyTimePunch(userId, timePunchData) {
    // Notify the user
    this.sendToUser(userId, {
      type: 'time_punch_created',
      data: timePunchData,
      timestamp: new Date().toISOString()
    });

    // Notify management
    this.sendToRoom('management', {
      type: 'employee_time_punch',
      userId,
      data: timePunchData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about payroll updates
   */
  notifyPayrollUpdate(userId, payrollData) {
    this.sendToUser(userId, {
      type: 'payroll_update',
      data: payrollData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about new pay stub
   */
  notifyNewPayStub(userId, payStubData) {
    this.sendToUser(userId, {
      type: 'new_pay_stub',
      data: payStubData,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send system notification
   */
  sendSystemNotification(message, roomId = 'general') {
    this.sendToRoom(roomId, {
      type: 'system_notification',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      totalConnections: this.wss ? this.wss.clients.size : 0,
      uniqueUsers: this.clients.size,
      activeRooms: this.rooms.size,
      roomDetails: Array.from(this.rooms.entries()).map(([roomId, users]) => ({
        roomId,
        userCount: users.size
      }))
    };
  }
}

module.exports = new WebSocketService();
