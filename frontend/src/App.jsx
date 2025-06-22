import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAuth } from './contexts/AuthContext.simple'
import Layout from './components/Layout/Layout'
import LoadingScreen from './components/UI/LoadingScreen'

// Pages
import LoginPage from './pages/Auth/LoginPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import EmployeesPage from './pages/Employees/EmployeesPage'
import TimeTrackingPage from './pages/TimeTracking/TimeTrackingPage'
import PayrollPage from './pages/Payroll/PayrollPage'
import PayStubsPage from './pages/PayStubs/PayStubsPage'
import JobRolesPage from './pages/JobRoles/JobRolesPage'
import AnalyticsPage from './pages/Analytics/AnalyticsPage'
import SettingsPage from './pages/Settings/SettingsPage'
import ProfilePage from './pages/Profile/ProfilePage'
import NotFoundPage from './pages/NotFound/NotFoundPage'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  return user ? children : <Navigate to="/login" />
}

// Public Route Component (redirect if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  return user ? <Navigate to="/" /> : children
}

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="time-tracking" element={<TimeTrackingPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="pay-stubs" element={<PayStubsPage />} />
          <Route path="job-roles" element={<JobRolesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Box>
  )
}

export default App
