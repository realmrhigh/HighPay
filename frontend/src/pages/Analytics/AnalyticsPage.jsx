import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Analytics, Assessment } from '@mui/icons-material'

const AnalyticsPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Analytics & Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Detailed insights and reporting for your business
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Assessment />}>
          Generate Report
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Analytics sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Advanced Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Comprehensive analytics dashboard featuring:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Productivity Metrics" variant="outlined" />
            <Chip label="Attendance Analytics" variant="outlined" />
            <Chip label="Cost Analysis" variant="outlined" />
            <Chip label="Trend Reports" variant="outlined" />
            <Chip label="Custom Reports" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Full analytics dashboard with charts and reports coming soon!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AnalyticsPage
