import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  useTheme,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Fab,
  Tooltip,
  Badge,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People,
  Schedule,
  Payment,
  Receipt,
  TrendingUp,
  PlayArrow,
  Stop,
  Pause,
  Refresh,
  NotificationsActive,
  Analytics,
  WorkHistory,
  AccountBalanceWallet,
  Group,
  AccessTime,
  AttachMoney,
  Insights,
  Speed,
  Timeline,
  Add,
  Settings,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext.simple'
import { useWebSocket } from '../../contexts/WebSocketContext.simple'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Enhanced mock data generators
const generateTimeSeriesData = (days = 7) => {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i)
    return {
      date: format(date, 'MMM dd'),
      hours: Math.round((Math.random() * 4 + 6) * 10) / 10,
      productivity: Math.round((Math.random() * 30 + 70)),
      revenue: Math.round(Math.random() * 5000 + 15000),
    }
  })
}

const generateDepartmentData = () => [
  { name: 'Engineering', employees: 24, hours: 192, color: '#1976d2' },
  { name: 'Marketing', employees: 12, hours: 96, color: '#dc004e' },
  { name: 'Sales', employees: 18, hours: 144, color: '#2e7d32' },
  { name: 'HR', employees: 8, hours: 64, color: '#ed6c02' },
  { name: 'Finance', employees: 6, hours: 48, color: '#9c27b0' },
]

const generateRecentActivities = () => [
  {
    id: 1,
    user: 'John Doe',
    action: 'Clocked in',
    time: '2 minutes ago',
    avatar: null,
    type: 'clock-in',
  },
  {
    id: 2,
    user: 'Sarah Johnson',
    action: 'Submitted timesheet',
    time: '15 minutes ago',
    avatar: null,
    type: 'timesheet',
  },
  {
    id: 3,
    user: 'Mike Wilson',
    action: 'Started break',
    time: '23 minutes ago',
    avatar: null,
    type: 'break',
  },
  {
    id: 4,
    user: 'Lisa Chen',
    action: 'Clocked out',
    time: '1 hour ago',
    avatar: null,
    type: 'clock-out',
  },
  {
    id: 5,
    user: 'David Brown',
    action: 'Updated profile',
    time: '2 hours ago',
    avatar: null,
    type: 'profile',
  },
]

const DashboardPage = () => {
  const theme = useTheme()
  const { user, isAdmin, isManager } = useAuth()
  const { isConnected, notifications } = useWebSocket()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [userStatus, setUserStatus] = useState('offline') // offline, working, break
  const [expandedCard, setExpandedCard] = useState(null)
  const [timeSeriesData] = useState(generateTimeSeriesData(7))
  const [departmentData] = useState(generateDepartmentData())
  const [recentActivities] = useState(generateRecentActivities())
  const queryClient = useQueryClient()

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Mock analytics data with React Query
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        employee: { active: 145, total: 150, onBreak: 12, workingRemote: 23 },
        payroll: { totalGrossPay: 245000, avgSalary: 85000, totalBenefits: 45000 },
        timeTracking: { totalHours: 2840, avgHoursPerEmployee: 38.5, overtime: 124 },
        productivity: { score: 87, trend: '+5%', efficiency: 92 },
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: realtimeData } = useQuery({
    queryKey: ['dashboard-realtime'],
    queryFn: async () => {
      return {
        todayPunches: { clockedIn: 45, onBreak: 8, clockedOut: 12 },
        currentlyWorking: [
          { name: 'Alice Johnson', department: 'Engineering', since: '09:00 AM' },
          { name: 'Bob Smith', department: 'Marketing', since: '08:30 AM' },
          { name: 'Carol Davis', department: 'Sales', since: '09:15 AM' },
        ],
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Time punch mutations with enhanced feedback
  const clockInMutation = useMutation({
    mutationFn: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, type: 'clock_in', timestamp: new Date() }
    },
    onSuccess: () => {
      toast.success('🟢 Clocked in successfully!', {
        icon: '⏰',
        style: { background: '#4caf50', color: 'white' }
      })
      setUserStatus('working')
      queryClient.invalidateQueries(['dashboard-realtime'])
    },
    onError: (error) => {
      toast.error('❌ Failed to clock in: ' + error.message)
    },
  })

  const clockOutMutation = useMutation({
    mutationFn: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, type: 'clock_out', timestamp: new Date() }
    },
    onSuccess: () => {
      toast.success('🔴 Clocked out successfully!', {
        icon: '👋',
        style: { background: '#f44336', color: 'white' }
      })
      setUserStatus('offline')
      queryClient.invalidateQueries(['dashboard-realtime'])
    },
  })

  const breakMutation = useMutation({
    mutationFn: async (data) => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, type: 'break_start', timestamp: new Date() }
    },
    onSuccess: () => {
      toast.success('☕ Break started!', {
        icon: '⏸️',
        style: { background: '#ff9800', color: 'white' }
      })
      setUserStatus('break')
      queryClient.invalidateQueries(['dashboard-realtime'])
    },
  })

  // Handle time punch actions with geolocation
  const handleClockIn = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clockInMutation.mutate({
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          })
        },
        () => clockInMutation.mutate({})
      )
    } else {
      clockInMutation.mutate({})
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'working': return 'success'
      case 'break': return 'warning'
      case 'offline': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'working': return '🟢 Working'
      case 'break': return '🟡 On Break'
      case 'offline': return '⚫ Offline'
      default: return 'Unknown'
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'clock-in': return <PlayArrow color="success" />
      case 'clock-out': return <Stop color="error" />
      case 'break': return <Pause color="warning" />
      case 'timesheet': return <Schedule color="primary" />
      case 'profile': return <Settings color="info" />
      default: return <WorkHistory />
    }
  }

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    hover: { y: -5, transition: { duration: 0.2 } }
  }

  const statsVariants = {
    hidden: { scale: 0 },
    visible: { scale: 1, transition: { type: 'spring', stiffness: 100 } }
  }

  if (analyticsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Enhanced Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.firstName}! ✨
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Here's what's happening with your team today
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Chip
                  icon={isConnected ? <TrendingUp /> : <Stop />}
                  label={isConnected ? '🟢 Live Updates' : '🔴 Disconnected'}
                  color={isConnected ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                />
              </motion.div>
              
              <Paper sx={{ px: 3, py: 1.5, borderRadius: 3 }}>
                <Typography variant="h6" fontWeight={600} color="primary">
                  {format(currentTime, 'EEEE, MMM dd • h:mm a')}
                </Typography>
              </Paper>
            </Box>
          </Box>
        </motion.div>

        <Grid container spacing={3}>
          {/* Time Tracking Widget */}
          <Grid item xs={12} md={6} lg={4}>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight={700}>
                      ⏰ Time Tracking
                    </Typography>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <Schedule />
                    </Avatar>
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9 }} gutterBottom>
                      Current Status
                    </Typography>
                    <Chip
                      label={getStatusText(userStatus)}
                      color={getStatusColor(userStatus)}
                      size="large"
                      sx={{ mb: 2, fontWeight: 600 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {userStatus === 'offline' && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<PlayArrow />}
                          onClick={handleClockIn}
                          disabled={clockInMutation.isPending}
                          sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                        >
                          Clock In
                        </Button>
                      </motion.div>
                    )}
                    
                    {userStatus === 'working' && (
                      <>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<Stop />}
                            onClick={() => clockOutMutation.mutate()}
                            disabled={clockOutMutation.isPending}
                            sx={{ bgcolor: '#f44336', '&:hover': { bgcolor: '#d32f2f' } }}
                          >
                            Clock Out
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outlined"
                            startIcon={<Pause />}
                            onClick={() => breakMutation.mutate()}
                            disabled={breakMutation.isPending}
                            sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
                          >
                            Break
                          </Button>
                        </motion.div>
                      </>
                    )}
                    
                    {userStatus === 'break' && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<PlayArrow />}
                          onClick={handleClockIn}
                          disabled={clockInMutation.isPending}
                          sx={{ bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' } }}
                        >
                          End Break
                        </Button>
                      </motion.div>
                    )}
                  </Box>

                  {(clockInMutation.isPending || clockOutMutation.isPending || breakMutation.isPending) && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Quick Stats - Admin/Manager Only */}
          {(isAdmin || isManager) && analyticsData && (
            <>
              <Grid item xs={6} md={3} lg={2}>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <CardContent>
                      <motion.div variants={statsVariants} initial="hidden" animate="visible">
                        <People sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" fontWeight={700}>
                          {analyticsData.employee.active}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Active Today
                        </Typography>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={6} md={3} lg={2}>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <CardContent>
                      <motion.div variants={statsVariants} initial="hidden" animate="visible">
                        <Schedule sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" fontWeight={700}>
                          {realtimeData?.todayPunches.clockedIn || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Working Now
                        </Typography>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={6} md={3} lg={2}>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <CardContent>
                      <motion.div variants={statsVariants} initial="hidden" animate="visible">
                        <AttachMoney sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" fontWeight={700}>
                          ${(analyticsData.payroll.totalGrossPay / 1000).toFixed(0)}K
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Monthly Payroll
                        </Typography>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={6} md={3} lg={2}>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Card sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                    <CardContent>
                      <motion.div variants={statsVariants} initial="hidden" animate="visible">
                        <Speed sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" fontWeight={700}>
                          {analyticsData.productivity.score}%
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Productivity
                        </Typography>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </>
          )}

          {/* Enhanced Analytics Charts */}
          {(isAdmin || isManager) && (
            <>
              <Grid item xs={12} lg={8}>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Card sx={{ height: 400 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                          📈 Weekly Performance Trends
                        </Typography>
                        <Chip label="Last 7 Days" size="small" variant="outlined" />
                      </Box>
                      
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={timeSeriesData}>
                          <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorProductivity" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#dc004e" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#dc004e" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                          <RechartsTooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
                            }} 
                          />
                          <Area type="monotone" dataKey="hours" stroke="#1976d2" fillOpacity={1} fill="url(#colorHours)" name="Hours Worked" />
                          <Area type="monotone" dataKey="productivity" stroke="#dc004e" fillOpacity={1} fill="url(#colorProductivity)" name="Productivity %" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>

              <Grid item xs={12} lg={4}>
                <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                  <Card sx={{ height: 400 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        🏢 Department Overview
                      </Typography>
                      
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={departmentData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="employees"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {departmentData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      <Box sx={{ mt: 2 }}>
                        {departmentData.map((dept, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: 12, height: 12, bgcolor: dept.color, borderRadius: '50%', mr: 1 }} />
                            <Typography variant="body2" sx={{ flexGrow: 1 }}>
                              {dept.name}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {dept.employees} people
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            </>
          )}

          {/* Real-time Activity Feed */}
          <Grid item xs={12} md={6}>
            <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
              <Card sx={{ height: 450 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      🔔 Live Activity Feed
                    </Typography>
                    <Badge badgeContent={recentActivities.length} color="primary">
                      <NotificationsActive color="action" />
                    </Badge>
                  </Box>
                  
                  <List sx={{ maxHeight: 350, overflow: 'auto' }}>
                    <AnimatePresence>
                      {recentActivities.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ListItem sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                {getActivityIcon(activity.type)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2">
                                  <strong>{activity.user}</strong> {activity.action.toLowerCase()}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  {activity.time}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </List>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Currently Working - Admin/Manager Only */}
          {(isAdmin || isManager) && realtimeData?.currentlyWorking && (
            <Grid item xs={12} md={6}>
              <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
                <Card sx={{ height: 450 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        👥 Currently Working
                      </Typography>
                      <Chip 
                        label={`${realtimeData.currentlyWorking.length} active`} 
                        color="success" 
                        size="small"
                      />
                    </Box>
                    
                    <List>
                      {realtimeData.currentlyWorking.map((employee, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <ListItem sx={{ px: 0 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                                {employee.name.split(' ').map(n => n[0]).join('')}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {employee.name}
                                </Typography>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {employee.department}
                                  </Typography>
                                  <Typography variant="caption" color="success.main">
                                    🟢 Since {employee.since}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < realtimeData.currentlyWorking.length - 1 && <Divider variant="inset" component="li" />}
                        </motion.div>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}

          {/* Success Alert */}
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Alert 
                severity="success" 
                sx={{ 
                  borderRadius: 3,
                  '& .MuiAlert-icon': { fontSize: '1.5rem' }
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  🎉 HighPay Dashboard v2.0 is Live!
                </Typography>
                <Typography variant="body2">
                  All systems operational with real-time updates, advanced analytics, beautiful animations, and enhanced user experience. Welcome to the future of payroll management!
                </Typography>
              </Alert>
            </motion.div>
          </Grid>
        </Grid>

        {/* Floating Action Button */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: 'spring', stiffness: 100 }}
          style={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          <Tooltip title="Quick Actions">
            <Fab 
              color="primary" 
              sx={{ 
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
                }
              }}
            >
              <Add />
            </Fab>
          </Tooltip>
        </motion.div>
      </Box>
    </motion.div>
  )
}

export default DashboardPage
