import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.simple'
import { useOffline } from './contexts/OfflineContext'
import { useLocation as useLocationContext } from './contexts/LocationContext'
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
  Grid,
  LinearProgress
} from '@mui/material'
import { 
  PlayArrow, 
  Refresh, 
  CheckCircle, 
  Navigation,
  Person,
  Login,
  Logout,
  WifiOff,
  Wifi,
  LocationOn,
  LocationOff,
  CloudSync,
  CloudOff
} from '@mui/icons-material'

function TestAppComplete() {
  const [count, setCount] = useState(0)
  const [timestamp] = useState(new Date().toLocaleTimeString())
  const navigate = useNavigate()
  const location = useLocation()
  
  // Auth context
  const { user, login, logout, loading: authLoading } = useAuth()
  
  // Offline context
  const { 
    isOnline, 
    syncStatus, 
    pendingSync, 
    lastSyncTime 
  } = useOffline()
  
  // Location context
  const { 
    currentLocation, 
    locationStatus, 
    requestLocation, 
    isLocationEnabled 
  } = useLocationContext()

  useEffect(() => {
    console.log('✅ TestApp with ALL THREE contexts mounted successfully')
    console.log('✅ Auth user:', user)
    console.log('✅ Online status:', isOnline)
    console.log('✅ Location status:', locationStatus)
    console.log('✅ Current location:', currentLocation)
  }, [user, isOnline, locationStatus, currentLocation])

  const handleAuthTest = async () => {
    if (user) {
      logout()
    } else {
      await login({ email: 'admin@highpay.com', password: 'admin123' })
    }
  }

  const handleLocationTest = () => {
    console.log('📍 Requesting location')
    requestLocation()
  }

  const getLocationStatusColor = () => {
    switch (locationStatus) {
      case 'granted': return 'success'
      case 'denied': return 'error'
      case 'requesting': return 'warning'
      default: return 'default'
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ 
        minHeight: '100vh', 
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card sx={{ width: '100%', mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h3" color="primary" gutterBottom textAlign="center">
              🎯 HighPay Dashboard Test
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              React + Router + Auth + Offline + Location - ALL CONTEXTS LOADED! 🚀
            </Alert>

            <Typography variant="h6" color="text.secondary" paragraph textAlign="center">
              Progressive App Rebuild - Step 4B (Full Context Integration Complete)
            </Typography>

            {/* Progress Indicators */}
            {(authLoading || locationStatus === 'requesting') && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                  {authLoading && 'Authenticating...'}
                  {locationStatus === 'requesting' && 'Requesting location access...'}
                </Typography>
              </Box>
            )}

            {/* Context Status Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Auth Status */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', bgcolor: user ? 'success.50' : 'grey.50' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: user ? 'success.main' : 'grey.400' }}>
                      <Person />
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {user ? 'Authenticated' : 'Not Authenticated'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {user ? `${user.firstName} (${user.role})` : 'Please login'}
                    </Typography>
                    <Button
                      size="small"
                      variant={user ? "outlined" : "contained"}
                      color={user ? "error" : "primary"}
                      startIcon={user ? <Logout /> : <Login />}
                      onClick={handleAuthTest}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Loading...' : (user ? 'Logout' : 'Login')}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* Offline Status */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', bgcolor: isOnline ? 'info.50' : 'warning.50' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: isOnline ? 'info.main' : 'warning.main' }}>
                      {isOnline ? <Wifi /> : <WifiOff />}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      {isOnline ? 'Online' : 'Offline'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Sync: {syncStatus}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {pendingSync > 0 && `${pendingSync} pending`}
                    </Typography>
                    <Chip 
                      icon={isOnline ? <CloudSync /> : <CloudOff />}
                      label={isOnline ? 'Connected' : 'Offline Mode'}
                      size="small"
                      color={isOnline ? 'success' : 'warning'}
                    />
                  </CardContent>
                </Card>
              </Grid>

              {/* Location Status */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%', bgcolor: `${getLocationStatusColor()}.50` }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: `${getLocationStatusColor()}.main` }}>
                      {isLocationEnabled ? <LocationOn /> : <LocationOff />}
                    </Avatar>
                    <Typography variant="h6" gutterBottom>
                      Location Services
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Status: {locationStatus}
                    </Typography>
                    {currentLocation && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                      </Typography>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={handleLocationTest}
                      disabled={locationStatus === 'requesting'}
                    >
                      {locationStatus === 'requesting' ? 'Requesting...' : 'Get Location'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Control Chips */}
            <Grid container spacing={1} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Chip 
                  icon={<CheckCircle />}
                  label={`Build: ${timestamp}`} 
                  color="primary" 
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip 
                  label={`Counter: ${count}`} 
                  color="secondary" 
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip 
                  icon={<Navigation />}
                  label={`Route: ${location.pathname}`} 
                  variant="outlined" 
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Chip 
                  icon={<LocationOn />}
                  label={locationStatus || 'Unknown'}
                  color={getLocationStatusColor()}
                  sx={{ width: '100%' }}
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
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
                onClick={() => navigate(location.pathname === '/' ? '/test' : '/')}
                color="success"
              >
                Navigate
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* System Status */}
            <Box sx={{ 
              textAlign: 'left', 
              p: 2, 
              bgcolor: 'grey.100', 
              borderRadius: 1,
              mb: 3 
            }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>React:</strong> {React.version} - Working perfectly
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>Material-UI:</strong> Components & theming loaded
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>React Router:</strong> Navigation & routing active
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>Auth Context:</strong> User authentication working
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>Offline Context:</strong> Network status & sync ready
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✅ <strong>Location Context:</strong> GPS services {currentLocation ? 'active' : 'ready'}
              </Typography>
              <Typography variant="body2">
                🎯 <strong>All Systems:</strong> Ready for layout & full app!
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              <strong>Next Step:</strong> Add Layout Components → Full App.jsx with routing
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default TestAppComplete
