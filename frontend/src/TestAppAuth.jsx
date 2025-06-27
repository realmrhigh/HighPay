import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.simple'
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  Chip,
  Container,
  Divider,
  Avatar,
  Grid
} from '@mui/material'
import { 
  PlayArrow, 
  Refresh, 
  CheckCircle, 
  Navigation,
  Person,
  Login,
  Logout
} from '@mui/icons-material'

function TestAppAuth() {
  const [count, setCount] = useState(0)
  const [timestamp] = useState(new Date().toLocaleTimeString())
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, logout, loading } = useAuth()

  useEffect(() => {
    console.log('✅ TestApp with Auth mounted successfully')
    console.log('✅ Current route:', location.pathname)
    console.log('✅ User state:', user)
    console.log('✅ Auth loading:', loading)
  }, [location, user, loading])

  const handleNavigationTest = () => {
    const newPath = location.pathname === '/' ? '/test' : '/'
    console.log('🧭 Navigating to:', newPath)
    navigate(newPath)
  }

  const handleAuthTest = async () => {
    if (user) {
      console.log('🔓 Logging out user')
      logout()
    } else {
      console.log('🔐 Logging in user')
      await login({ email: 'admin@highpay.com', password: 'admin123' })
    }
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        minHeight: '100vh', 
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card sx={{ width: '100%', mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h3" color="primary" gutterBottom>
              🎯 HighPay Dashboard Test
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              React + Material-UI + Router + Auth Successfully Loaded!
            </Alert>

            <Typography variant="h6" color="text.secondary" paragraph>
              Progressive App Rebuild - Step 3
            </Typography>

            {/* Auth Status Section */}
            <Card sx={{ mb: 3, bgcolor: user ? 'success.50' : 'grey.50' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: user ? 'success.main' : 'grey.400' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {user ? `Welcome, ${user.firstName}!` : 'Not Authenticated'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user ? `Role: ${user.role} | Email: ${user.email}` : 'Please login to continue'}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant={user ? "outlined" : "contained"}
                  color={user ? "error" : "primary"}
                  startIcon={user ? <Logout /> : <Login />}
                  onClick={handleAuthTest}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : (user ? 'Logout' : 'Login')}
                </Button>
              </CardContent>
            </Card>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Chip 
                  icon={<CheckCircle />}
                  label={`Build: ${timestamp}`} 
                  color="primary" 
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip 
                  label={`Counter: ${count}`} 
                  color="secondary" 
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Chip 
                  icon={<Navigation />}
                  label={`Route: ${location.pathname}`} 
                  variant="outlined" 
                  sx={{ width: '100%' }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<PlayArrow />}
                onClick={() => setCount(count + 1)}
                color="primary"
              >
                Count: {count}
              </Button>
              <Button 
                variant="outlined" 
                size="large" 
                startIcon={<Refresh />}
                onClick={() => setCount(0)}
                color="secondary"
              >
                Reset
              </Button>
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<Navigation />}
                onClick={handleNavigationTest}
                color="success"
              >
                Test Navigation
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ 
              textAlign: 'left', 
              p: 2, 
              bgcolor: 'grey.100', 
              borderRadius: 1,
              mb: 3 
            }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>React:</strong> {React.version} - State & effects
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>Material-UI:</strong> Components & theming
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>React Router:</strong> Navigation & routing
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>Auth Context:</strong> User state management
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>Vite HMR:</strong> Hot reloading active
              </Typography>
              <Typography variant="body2">
                ✅ <strong>Browser Cache:</strong> Cleared & working
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              <strong>Next Step:</strong> Add Location & Offline Contexts → Layout Components → Full App
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default TestAppAuth
