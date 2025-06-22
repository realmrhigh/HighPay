import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Settings, Save } from '@mui/icons-material'

const SettingsPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Settings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure system preferences and company settings
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Save />}>
          Save Settings
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Settings sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            System Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Customize your HighPay experience with:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Company Profile" variant="outlined" />
            <Chip label="Payroll Settings" variant="outlined" />
            <Chip label="Time Tracking Rules" variant="outlined" />
            <Chip label="Notification Preferences" variant="outlined" />
            <Chip label="Security Settings" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Settings management coming soon!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SettingsPage
