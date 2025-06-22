import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Work, Add } from '@mui/icons-material'

const JobRolesPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Job Roles
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage job positions and pay rates
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          Add Job Role
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Work sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Job Role Management
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Configure job roles with:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Position Definitions" variant="outlined" />
            <Chip label="Pay Rates" variant="outlined" />
            <Chip label="Responsibilities" variant="outlined" />
            <Chip label="Department Assignment" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Job role management coming soon!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default JobRolesPage
