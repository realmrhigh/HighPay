import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'

const WebSocketContext = createContext()

// Enhanced WebSocket Provider with comprehensive real-time features
export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [realtimeData, setRealtimeData] = useState({
    activeEmployees: 0,
    currentlyWorking: 0,
    onBreak: 0,
    todayPunches: [],
    liveUpdates: [],
  })
  const [connectionStats, setConnectionStats] = useState({
    reconnectAttempts: 0,
    lastConnected: null,
    totalMessages: 0,
    latency: null,
  })
  
  const socketRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const heartbeatIntervalRef = useRef(null)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  // Initialize WebSocket connection
  useEffect(() => {
    if (user && user.id) {
      connectWebSocket()
    }

    return () => {
      disconnectWebSocket()
    }
  }, [user])

  const connectWebSocket = () => {
    try {
      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      // Create new socket connection with enhanced options
      socketRef.current = io(process.env.NODE_ENV === 'production' ? 'wss://your-domain.com' : 'ws://localhost:3000', {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: reconnectDelay,
        auth: {
          userId: user?.id,
          sessionId: user?.sessionId,
          role: user?.role,
        },
        query: {
          department: user?.department,
          position: user?.position,
        },
      })

      setupSocketListeners()
      
    } catch (error) {
      console.error('WebSocket connection error:', error)
      setConnectionError(error.message)
      handleReconnect()
    }
  }

  const setupSocketListeners = () => {
    const socket = socketRef.current

    // Connection events
    socket.on('connect', () => {
      console.log('✅ WebSocket connected:', socket.id)
      setIsConnected(true)
      setConnectionError(null)
      setConnectionStats(prev => ({
        ...prev,
        reconnectAttempts: 0,
        lastConnected: new Date().toISOString(),
      }))
      
      // Join user-specific room
      socket.emit('join_user_room', {
        userId: user.id,
        userData: {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
        },
      })

      // Start heartbeat
      startHeartbeat()
      
      toast.success('🟢 Connected to live updates', {
        id: 'websocket-connect',
        duration: 2000,
      })
    })

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason)
      setIsConnected(false)
      clearInterval(heartbeatIntervalRef.current)
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect - manual reconnect needed
        handleReconnect()
      }
      
      toast.error('🔴 Live updates disconnected', {
        id: 'websocket-disconnect',
        duration: 3000,
      })
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setConnectionError(error.message)
      setIsConnected(false)
    })

    // Real-time data events
    socket.on('user_status_update', (data) => {
      setRealtimeData(prev => ({
        ...prev,
        activeEmployees: data.activeEmployees,
        currentlyWorking: data.currentlyWorking,
        onBreak: data.onBreak,
      }))
      
      addNotification({
        id: Date.now(),
        type: 'status_update',
        title: 'Status Update',
        message: `${data.userName} ${data.action}`,
        timestamp: new Date().toISOString(),
        data: data,
      })
    })

    socket.on('time_punch', (data) => {
      setRealtimeData(prev => ({
        ...prev,
        todayPunches: [data, ...prev.todayPunches.slice(0, 49)], // Keep last 50
      }))
      
      const action = data.type === 'clock_in' ? 'clocked in' : 
                    data.type === 'clock_out' ? 'clocked out' : 
                    data.type === 'break_start' ? 'started break' : 
                    'ended break'
      
      addNotification({
        id: Date.now(),
        type: 'time_punch',
        title: 'Time Tracking Update',
        message: `${data.userName} ${action}`,
        timestamp: new Date().toISOString(),
        data: data,
      })
    })

    socket.on('payroll_update', (data) => {
      addNotification({
        id: Date.now(),
        type: 'payroll',
        title: 'Payroll Update',
        message: data.message,
        timestamp: new Date().toISOString(),
        data: data,
      })
    })

    socket.on('system_notification', (data) => {
      addNotification({
        id: Date.now(),
        type: 'system',
        title: data.title,
        message: data.message,
        timestamp: new Date().toISOString(),
        data: data,
      })
      
      // Show toast for important system notifications
      if (data.priority === 'high') {
        toast(data.message, {
          icon: '⚠️',
          duration: 5000,
        })
      }
    })

    socket.on('online_users_update', (users) => {
      setOnlineUsers(users)
    })

    socket.on('bulk_data_update', (data) => {
      setRealtimeData(prev => ({
        ...prev,
        ...data,
      }))
    })

    // Heartbeat response
    socket.on('pong', (latency) => {
      setConnectionStats(prev => ({
        ...prev,
        latency: latency,
        totalMessages: prev.totalMessages + 1,
      }))
    })

    // Error handling
    socket.on('error', (error) => {
      console.error('WebSocket error:', error)
      toast.error(`Connection error: ${error.message}`)
    })
  }

  const startHeartbeat = () => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const startTime = Date.now()
        socketRef.current.emit('ping', startTime)
      }
    }, 30000) // Every 30 seconds
  }

  const handleReconnect = () => {
    if (connectionStats.reconnectAttempts >= maxReconnectAttempts) {
      toast.error('❌ Unable to connect to live updates. Please refresh the page.', {
        duration: 8000,
      })
      return
    }

    setConnectionStats(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }))

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect... (${connectionStats.reconnectAttempts}/${maxReconnectAttempts})`)
      connectWebSocket()
    }, reconnectDelay * Math.pow(2, connectionStats.reconnectAttempts)) // Exponential backoff
  }

  const disconnectWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
    }
    
    setIsConnected(false)
  }

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 99)]) // Keep last 100 notifications
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  // Emit events to server
  const emitUserStatusChange = (status) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user_status_change', {
        userId: user.id,
        status: status,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const emitTimePunch = (punchData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('time_punch', {
        userId: user.id,
        ...punchData,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const emitJoinRoom = (roomName) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', roomName)
    }
  }

  const emitLeaveRoom = (roomName) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', roomName)
    }
  }

  // Subscribe to specific data updates
  const subscribeToUpdates = (updateType) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', updateType)
    }
  }

  const unsubscribeFromUpdates = (updateType) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', updateType)
    }
  }

  // Manual reconnect
  const reconnect = () => {
    setConnectionStats(prev => ({ ...prev, reconnectAttempts: 0 }))
    connectWebSocket()
  }

  // Get connection quality
  const getConnectionQuality = () => {
    if (!isConnected) return 'poor'
    if (connectionStats.latency === null) return 'unknown'
    if (connectionStats.latency < 100) return 'excellent'
    if (connectionStats.latency < 300) return 'good'
    if (connectionStats.latency < 1000) return 'fair'
    return 'poor'
  }

  const value = {
    // Connection state
    isConnected,
    connectionError,
    connectionStats,
    
    // Data
    notifications,
    onlineUsers,
    realtimeData,
    
    // Actions
    addNotification,
    removeNotification,
    clearAllNotifications,
    markNotificationAsRead,
    emitUserStatusChange,
    emitTimePunch,
    emitJoinRoom,
    emitLeaveRoom,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    reconnect,
    disconnect: disconnectWebSocket,
    
    // Utils
    getConnectionQuality,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export default WebSocketContext
