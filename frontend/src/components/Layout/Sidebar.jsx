import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  useTheme,
  Collapse,
} from '@mui/material'
import {
  Dashboard,
  People,
  Schedule,
  AccountBalance,
  Receipt,
  Work,
  Analytics,
  Settings,
  ExpandLess,
  ExpandMore,
  Person,
  Group,
  TimelapseOutlined,
  PaymentOutlined,
  ReceiptLongOutlined,
  BusinessCenterOutlined,
  BarChartOutlined,
  SettingsOutlined,
  LocationOn,
  CalendarToday,
  EditNote,
  History,
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useState } from 'react'

const drawerWidth = 280
const collapsedWidth = 80

const navigationItems = [
  {
    text: 'Dashboard',
    path: '/',
    icon: <Dashboard />,
    roles: ['admin', 'manager', 'employee'],
  },
  {
    text: 'Employees',
    path: '/employees',
    icon: <Group />,
    roles: ['admin', 'manager'],
  },
  {
    text: 'Time Tracking',
    path: '/time-tracking',
    icon: <TimelapseOutlined />,
    roles: ['admin', 'manager', 'employee'],
  },
  {
    text: 'Locations',
    path: '/locations',
    icon: <LocationOn />,
    roles: ['admin', 'manager'],
  },
  {
    text: 'Schedules',
    path: '/schedules',
    icon: <CalendarToday />,
    roles: ['admin', 'manager', 'employee'],
  },
  {
    text: 'Corrections',
    path: '/corrections',
    icon: <EditNote />,
    roles: ['admin', 'manager', 'employee'],
  },
  {
    text: 'Payroll',
    path: '/payroll',
    icon: <PaymentOutlined />,
    roles: ['admin', 'manager'],
  },
  {
    text: 'Pay Stubs',
    path: '/pay-stubs',
    icon: <ReceiptLongOutlined />,
    roles: ['admin', 'manager', 'employee'],
  },
  {
    text: 'Job Roles',
    path: '/job-roles',
    icon: <BusinessCenterOutlined />,
    roles: ['admin', 'manager'],
  },
  {
    text: 'Analytics',
    path: '/analytics',
    icon: <BarChartOutlined />,
    roles: ['admin', 'manager'],
  },
  {
    text: 'Audit Logs',
    path: '/audit-logs',
    icon: <History />,
    roles: ['admin', 'manager'],
  },
  {
    text: 'Settings',
    path: '/settings',
    icon: <SettingsOutlined />,
    roles: ['admin', 'manager', 'employee'],
  },
]

const Sidebar = ({ open, onToggle, isMobile }) => {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin, isManager } = useAuth()
  const [expandedItems, setExpandedItems] = useState({})

  const handleItemClick = (path) => {
    navigate(path)
    if (isMobile) {
      onToggle()
    }
  }

  const toggleExpanded = (itemText) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemText]: !prev[itemText]
    }))
  }

  const canAccess = (roles) => {
    if (!user) return false
    return roles.includes(user.role)
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const DrawerContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: open ? 3 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          minHeight: 64,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          bgcolor: theme.palette.primary.main,
          color: 'white',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            bgcolor: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: open ? 2 : 0,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            H
          </Typography>
        </Box>
        {open && (
          <Box>
            <Typography variant="h6" fontWeight="bold">
              HighPay
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Payroll Management
            </Typography>
          </Box>
        )}
      </Box>

      {/* User Info */}
      {open && (
        <Box sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                bgcolor: theme.palette.primary.main,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                mr: 2,
              }}
            >
              <Typography variant="subtitle2">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1 }}>
        {navigationItems.map((item) => {
          if (!canAccess(item.roles)) return null

          const active = isActive(item.path)
          
          return (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                onClick={() => handleItemClick(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  mx: 1,
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: active ? theme.palette.primary.main : 'transparent',
                  color: active ? 'white' : 'inherit',
                  '&:hover': {
                    bgcolor: active 
                      ? theme.palette.primary.dark 
                      : theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                    color: active ? 'white' : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: open ? 1 : 0,
                    '& .MuiListItemText-primary': {
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 400,
                    }
                  }} 
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>

      {/* Footer */}
      {open && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            HighPay v1.0
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            © 2025 HighPay Inc.
          </Typography>
        </Box>
      )}
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            border: 'none',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <DrawerContent />
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={true}
      sx={{
        width: open ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          border: 'none',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        },
      }}
    >
      <DrawerContent />
    </Drawer>
  )
}

export default Sidebar
