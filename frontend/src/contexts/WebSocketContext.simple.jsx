import React, { createContext, useContext } from 'react'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const value = {
    isConnected: false,
    socket: null,
    emit: () => {},
    on: () => {},
    off: () => {},
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
