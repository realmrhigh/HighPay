import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { useAuth } from './contexts/AuthContext.simple'
import { LocationProvider } from './contexts/LocationContext.simple'
import { OfflineProvider } from './contexts/OfflineContext'
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
import { LocationsPage } from './pages/Locations'
import { SchedulesPage } from './pages/Schedules'
import { CorrectionsPage } from './pages/Corrections'
import { AuditLogsPage } from './pages/AuditLogs'
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

function AppFull() {
  return (
    <OfflineProvider>
      <LocationProvider>
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
              <Route path="locations" element={<LocationsPage />} />
              <Route path="schedules" element={<SchedulesPage />} />
              <Route path="corrections" element={<CorrectionsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Box>
      </LocationProvider>
    </OfflineProvider>
  )
}

export default AppFull
