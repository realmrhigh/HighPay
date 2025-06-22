import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Schedule, AccessTime } from '@mui/icons-material'

const TimeTrackingPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Time Tracking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track work hours, breaks, and overtime
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AccessTime />}>
          View Reports
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Schedule sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Time Tracking System
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Comprehensive time tracking features including:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Clock In/Out" variant="outlined" />
            <Chip label="Break Tracking" variant="outlined" />
            <Chip label="Overtime Calculation" variant="outlined" />
            <Chip label="Time Reports" variant="outlined" />
            <Chip label="GPS Location" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Basic clock in/out functionality is available on the Dashboard. Full time tracking features coming soon!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default TimeTrackingPage
