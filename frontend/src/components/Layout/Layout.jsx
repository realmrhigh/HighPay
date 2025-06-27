import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import Sidebar from './Sidebar'
import Header from './Header'
import NotificationPanel from './NotificationPanel'
import { OfflineIndicator } from '../OfflineIndicator'

const Layout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleNotificationToggle = () => {
    setNotificationPanelOpen(!notificationPanelOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onToggle={handleSidebarToggle}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : (sidebarOpen ? '280px' : '80px'),
        }}
      >
        {/* Header */}
        <Header 
          onSidebarToggle={handleSidebarToggle}
          onNotificationToggle={handleNotificationToggle}
          sidebarOpen={sidebarOpen}
        />

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Page Content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
            backgroundColor: theme.palette.background.default,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Notification Panel */}
      <NotificationPanel 
        open={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />
    </Box>
  )
}

export default Layout
