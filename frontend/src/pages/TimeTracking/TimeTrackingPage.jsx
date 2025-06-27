import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Chip, 
  Grid,
  Alert,
  Divider
} from '@mui/material'
import { 
  Schedule, 
  AccessTime, 
  PlayArrow, 
  Stop, 
  Pause,
  LocationOn
} from '@mui/icons-material'
import { LocationValidation } from '../../components/LocationValidation'
import { useAuth } from '../../contexts/AuthContext.simple'
import { useOffline } from '../../contexts/OfflineContext'

const TimeTrackingPage = () => {
  const { user } = useAuth()
  const { isOnline } = useOffline()
  const [currentSession, setCurrentSession] = useState(null)
  const [locationValid, setLocationValid] = useState(false)
  const [showLocationValidation, setShowLocationValidation] = useState(false)

  // Mock current session check
  useEffect(() => {
    // In real app, check if user has an active time session
    const mockSession = {
      id: 1,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'work',
      location: 'Main Office'
    }
    // setCurrentSession(mockSession) // Uncomment to test active session
  }, [])

  const handleClockAction = async (action) => {
    if (!locationValid && !currentSession) {
      setShowLocationValidation(true)
      return
    }

    try {
      // In real app, make API call to clock in/out
      console.log(`${action} action performed`)
      
      if (action === 'clock-in') {
        setCurrentSession({
          id: Date.now(),
          startTime: new Date(),
          type: 'work',
          location: 'Current Location'
        })
      } else if (action === 'clock-out') {
        setCurrentSession(null)
      }
    } catch (error) {
      console.error('Clock action failed:', error)
    }
  }

  const formatDuration = (startTime) => {
    const now = new Date()
    const diff = now - startTime
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Time Tracking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Location-based time tracking with GPS validation
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AccessTime />}>
          View Reports
        </Button>
      </Box>

      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You're currently offline. Time punches will be saved locally and synced when connection is restored.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Session Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Session
              </Typography>
              {currentSession ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip 
                      label="CLOCKED IN" 
                      color="success" 
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formatDuration(currentSession.startTime)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Start Time:</strong> {currentSession.startTime.toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Location:</strong> {currentSession.location}
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={() => handleClockAction('clock-out')}
                    fullWidth
                  >
                    Clock Out
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    You are currently clocked out
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={() => handleClockAction('clock-in')}
                    fullWidth
                  >
                    Clock In
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Location Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Location Status
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 1, color: locationValid ? 'success.main' : 'error.main' }} />
                <Chip 
                  label={locationValid ? "LOCATION VERIFIED" : "LOCATION REQUIRED"}
                  color={locationValid ? "success" : "error"}
                  size="small"
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {locationValid 
                  ? "You are within an approved work location"
                  : "Location validation required for time tracking"
                }
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setShowLocationValidation(true)}
                fullWidth
              >
                Verify Location
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Features Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enhanced Time Tracking Features
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                HighPay v1.1 includes advanced location-based time tracking capabilities:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <Chip label="GPS Validation" variant="outlined" />
                <Chip label="WiFi Detection" variant="outlined" />
                <Chip label="Geofencing" variant="outlined" />
                <Chip label="Offline Support" variant="outlined" />
                <Chip label="Break Tracking" variant="outlined" />
                <Chip label="Overtime Calculation" variant="outlined" />
                <Chip label="Time Corrections" variant="outlined" />
                <Chip label="Audit Trail" variant="outlined" />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Location validation ensures accurate time tracking and compliance with work policies.
                All time punches are automatically synchronized and logged for audit purposes.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Location Validation Dialog */}
      <LocationValidation
        open={showLocationValidation}
        onClose={() => setShowLocationValidation(false)}
        onLocationValidated={(valid) => {
          setLocationValid(valid)
          setShowLocationValidation(false)
        }}
      />
    </Box>
  )
}

export default TimeTrackingPage
