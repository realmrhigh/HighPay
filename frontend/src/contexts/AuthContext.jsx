import React, { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'

const AuthContext = createContext()

// Enhanced demo users with more realistic data
const DEMO_USERS = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin123',
    email: 'admin@highpay.com',
    firstName: 'John',
    lastName: 'Administrator',
    role: 'admin',
    avatar: null,
    department: 'IT',
    position: 'System Administrator',
    hireDate: '2020-01-15',
    phone: '+1 (555) 123-4567',
    address: '123 Admin St, Tech City, TC 12345',
    permissions: ['*'], // All permissions
    settings: {
      theme: 'light',
      notifications: true,
      language: 'en',
    },
    lastLogin: new Date().toISOString(),
    isActive: true,
  },
  {
    id: 'manager-001',
    username: 'manager',
    password: 'manager123',
    email: 'manager@highpay.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'manager',
    avatar: null,
    department: 'Human Resources',
    position: 'HR Manager',
    hireDate: '2021-03-10',
    phone: '+1 (555) 234-5678',
    address: '456 Manager Ave, Business District, BD 23456',
    permissions: [
      'employees.read',
      'employees.create',
      'employees.update',
      'payroll.read',
      'payroll.create',
      'time-tracking.read',
      'analytics.read',
      'job-roles.manage',
    ],
    settings: {
      theme: 'light',
      notifications: true,
      language: 'en',
    },
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isActive: true,
  },
  {
    id: 'employee-001',
    username: 'employee',
    password: 'employee123',
    email: 'jane.smith@highpay.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'employee',
    avatar: null,
    department: 'Engineering',
    position: 'Software Developer',
    hireDate: '2022-06-01',
    phone: '+1 (555) 345-6789', 
    address: '789 Employee Rd, Worker Town, WT 34567',
    permissions: [
      'profile.read',
      'profile.update',
      'time-tracking.manage',
      'pay-stubs.read',
    ],
    settings: {
      theme: 'light',
      notifications: true,
      language: 'en',
    },
    lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    isActive: true,
  },
]

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('highpay_user')
        const storedSessionId = localStorage.getItem('highpay_session_id')
        
        if (storedUser && storedSessionId) {
          const parsedUser = JSON.parse(storedUser)
          
          // Validate session (in a real app, this would be a server call)
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser)
            setSessionId(storedSessionId)
            
            // Update last seen
            const updatedUser = {
              ...parsedUser,
              lastSeen: new Date().toISOString(),
            }
            setUser(updatedUser)
            localStorage.setItem('highpay_user', JSON.stringify(updatedUser))
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Clear invalid data
        localStorage.removeItem('highpay_user')
        localStorage.removeItem('highpay_session_id')
      } finally {
        setLoading(false)
      }
    }

    // Simulate network delay for more realistic loading
    const timer = setTimeout(initializeAuth, 800)
    return () => clearTimeout(timer)
  }, [])

  // Enhanced login function with better error handling
  const login = async (credentials) => {
    setLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { username, password } = credentials
      
      // Find user in demo data
      const foundUser = DEMO_USERS.find(
        u => u.username === username && u.password === password
      )

      if (!foundUser) {
        throw new Error('Invalid username or password')
      }

      if (!foundUser.isActive) {
        throw new Error('Account is deactivated. Please contact administrator.')
      }

      // Create session
      const newSessionId = uuidv4()
      const loginTime = new Date().toISOString()
      
      const loggedInUser = {
        ...foundUser,
        lastLogin: loginTime,
        lastSeen: loginTime,
        sessionId: newSessionId,
      }

      // Store in localStorage
      localStorage.setItem('highpay_user', JSON.stringify(loggedInUser))
      localStorage.setItem('highpay_session_id', newSessionId)

      setUser(loggedInUser)
      setSessionId(newSessionId)

      toast.success(`Welcome back, ${foundUser.firstName}!`)
      
      return { success: true, user: loggedInUser }
    } catch (error) {
      toast.error(error.message || 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Enhanced logout function
  const logout = async () => {
    setLoading(true)
    
    try {
      // Simulate API call to invalidate session
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Clear all auth data
      localStorage.removeItem('highpay_user')
      localStorage.removeItem('highpay_session_id')
      
      setUser(null)
      setSessionId(null)
      
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error during logout')
    } finally {
      setLoading(false)
    }
  }

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return

    try {
      const updatedUser = {
        ...user,
        ...updates,
        lastModified: new Date().toISOString(),
      }

      localStorage.setItem('highpay_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      toast.success('Profile updated successfully')
      return { success: true, user: updatedUser }
    } catch (error) {
      toast.error('Failed to update profile')
      throw error
    }
  }

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (!user) return false
    if (user.permissions.includes('*')) return true // Admin has all permissions
    return user.permissions.includes(permission)
  }

  // Role-based access helpers
  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager' || user?.role === 'admin'
  const isEmployee = user?.role === 'employee'

  // Activity tracking
  const updateLastSeen = () => {
    if (user) {
      const updatedUser = {
        ...user,
        lastSeen: new Date().toISOString(),
      }
      setUser(updatedUser)
      localStorage.setItem('highpay_user', JSON.stringify(updatedUser))
    }
  }

  // Auto-update last seen every 5 minutes
  useEffect(() => {
    if (user) {
      const interval = setInterval(updateLastSeen, 5 * 60 * 1000) // 5 minutes
      return () => clearInterval(interval)
    }
  }, [user])

  const value = {
    // State
    user,
    loading,
    sessionId,
    
    // Actions
    login,
    logout,
    updateProfile,
    
    // Permissions
    hasPermission,
    isAdmin,
    isManager,
    isEmployee,
    
    // Utils
    updateLastSeen,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
