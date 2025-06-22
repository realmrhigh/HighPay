import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Button,
  Divider,
  useTheme,
} from '@mui/material'
import {
  Close,
  NotificationsNone,
  Schedule,
  Payment,
  Receipt,
  Settings,
  Circle,
  ClearAll,
} from '@mui/icons-material'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { formatDistanceToNow } from 'date-fns'

const getNotificationIcon = (type) => {
  switch (type) {
    case 'time_punch':
    case 'time_punch_update':
      return <Schedule color="primary" />
    case 'payroll':
      return <Payment color="success" />
    case 'pay_stub':
      return <Receipt color="info" />
    case 'system':
      return <Settings color="warning" />
    default:
      return <NotificationsNone />
  }
}

const getNotificationColor = (type) => {
  switch (type) {
    case 'time_punch':
    case 'time_punch_update':
      return 'primary'
    case 'payroll':
      return 'success'
    case 'pay_stub':
      return 'info'
    case 'system':
      return 'warning'
    default:
      return 'default'
  }
}

const NotificationPanel = ({ open, onClose }) => {
  const theme = useTheme()
  const { notifications, clearNotifications, removeNotification } = useWebSocket()

  const handleMarkAsRead = (id) => {
    removeNotification(id)
  }

  const handleClearAll = () => {
    clearNotifications()
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          maxWidth: '90vw',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </Typography>
          {notifications.length > 0 && (
            <Button
              size="small"
              startIcon={<ClearAll />}
              onClick={handleClearAll}
              color="primary"
            >
              Clear All
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '50vh',
              p: 3,
            }}
          >
            <NotificationsNone sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications
            </Typography>
            <Typography variant="body2" color="text.disabled" align="center">
              You're all caught up! Real-time notifications will appear here.
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    py: 2,
                    backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                    borderLeft: notification.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.primary" gutterBottom>
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={notification.type.replace('_', ' ')}
                            size="small"
                            color={getNotificationColor(notification.type)}
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                      aria-label="remove notification"
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Real-time notifications powered by WebSocket
        </Typography>
      </Box>
    </Drawer>
  )
}

export default NotificationPanel
