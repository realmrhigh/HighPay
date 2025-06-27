import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  Chip,
  Container,
  Divider
} from '@mui/material'
import { PlayArrow, Refresh, CheckCircle, Navigation } from '@mui/icons-material'

function TestApp() {
  const [count, setCount] = useState(0)
  const [timestamp] = useState(new Date().toLocaleTimeString())
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    console.log('✅ TestApp with Router mounted successfully')
    console.log('✅ Current route:', location.pathname)
    console.log('✅ React Router working')
  }, [location])

  const handleNavigationTest = () => {
    const newPath = location.pathname === '/' ? '/test' : '/'
    console.log('🧭 Navigating to:', newPath)
    navigate(newPath)
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
              React + Material-UI + Router Successfully Loaded!
            </Alert>

            <Typography variant="h6" color="text.secondary" paragraph>
              Progressive App Rebuild - Step 2
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Chip 
                icon={<CheckCircle />}
                label={`Build: ${timestamp}`} 
                color="primary" 
                sx={{ mr: 1, mb: 1 }}
              />
              <Chip 
                label={`Counter: ${count}`} 
                color="secondary" 
                sx={{ mr: 1, mb: 1 }}
              />
              <Chip 
                icon={<Navigation />}
                label={`Route: ${location.pathname}`} 
                variant="outlined" 
                sx={{ mb: 1 }}
              />
            </Box>

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
                ✅ <strong>Vite HMR:</strong> Hot reloading active
              </Typography>
              <Typography variant="body2">
                ✅ <strong>Browser Cache:</strong> Cleared & working
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary">
              <strong>Next Step:</strong> Add Auth Context → Location/Offline Contexts → Full App
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}

export default TestApp
