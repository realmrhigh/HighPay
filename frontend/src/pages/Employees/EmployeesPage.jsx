import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { People, Add } from '@mui/icons-material'

const EmployeesPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Employees
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your team members and their information
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          Add Employee
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <People sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Employee Management
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This section will contain employee management functionality including:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Employee Directory" variant="outlined" />
            <Chip label="Add/Edit Employees" variant="outlined" />
            <Chip label="Role Management" variant="outlined" />
            <Chip label="Employee Profiles" variant="outlined" />
            <Chip label="Department Organization" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Coming soon in the next iteration!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default EmployeesPage
