import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  // Simple mock user
  const [user] = useState({
    id: '1',
    username: 'admin',
    email: 'admin@highpay.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
  })
  
  const [loading] = useState(false)

  const login = async (credentials) => {
    console.log('Login called with:', credentials)
    return { success: true }
  }

  const logout = () => {
    console.log('Logout called')
  }

  const value = {
    user,
    loading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
