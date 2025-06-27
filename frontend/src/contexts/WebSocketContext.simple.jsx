import React, { createContext, useContext, useState } from 'react'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  // Mock notifications for the NotificationPanel
  const [notifications] = useState([
    {
      id: 1,
      type: 'info',
      title: 'Welcome!',
      message: 'Dashboard is ready for use',
      timestamp: new Date().toISOString(),
      read: false
    }
  ])

  const value = {
    isConnected: false,
    socket: null,
    emit: () => {},
    on: () => {},
    off: () => {},
    // Add notification-related properties
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markNotificationAsRead: () => {},
    clearAllNotifications: () => {}
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
