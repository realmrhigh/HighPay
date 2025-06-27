import React from 'react'
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  Badge,
  useTheme,
  Chip,
} from '@mui/material'
import {
  Menu as MenuIcon,
  NotificationsOutlined,
  AccountCircle,
  Settings,
  Logout,
  WifiTethering,
  WifiTetheringOff,
} from '@mui/icons-material'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.simple'
import { useWebSocket } from '../../contexts/WebSocketContext.simple'
import { useNavigate } from 'react-router-dom'

const Header = ({ onSidebarToggle, onNotificationToggle, sidebarOpen }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isConnected, unreadCount } = useWebSocket()
  const [anchorEl, setAnchorEl] = useState(null)

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleProfileClick = () => {
    navigate('/profile')
    handleProfileMenuClose()
  }

  const handleSettingsClick = () => {
    navigate('/settings')
    handleProfileMenuClose()
  }

  const handleLogout = async () => {
    await logout()
    handleProfileMenuClose()
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: '#fff',
        color: theme.palette.text.primary,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
      elevation={0}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left Side */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle drawer"
            onClick={onSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
              HighPay Dashboard
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getGreeting()}, {user?.firstName || 'User'}!
            </Typography>
          </Box>
        </Box>

        {/* Right Side */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Connection Status */}
          <Chip
            icon={isConnected ? <WifiTethering /> : <WifiTetheringOff />}
            label={isConnected ? 'Live' : 'Offline'}
            size="small"
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
            sx={{ mr: 1 }}
          />

          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={onNotificationToggle}
            aria-label="show notifications"
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsOutlined />
            </Badge>
          </IconButton>

          {/* User Profile */}
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleProfileMenuOpen}
            aria-label="account menu"
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 200,
                '& .MuiMenuItem-root': {
                  px: 2,
                  py: 1,
                },
              },
            }}
          >
            <Box sx={{ px: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </Typography>
            </Box>
            
            <MenuItem onClick={handleProfileClick}>
              <AccountCircle sx={{ mr: 2 }} />
              Profile
            </MenuItem>
            
            <MenuItem onClick={handleSettingsClick}>
              <Settings sx={{ mr: 2 }} />
              Settings
            </MenuItem>
            
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout sx={{ mr: 2 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
