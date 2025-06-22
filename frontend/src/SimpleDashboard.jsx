import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
} from '@mui/material'
import {
  Dashboard,
  Schedule,
  People,
  Payment,
} from '@mui/icons-material'

const SimpleDashboard = ({ user, onLogout }) => {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Welcome to HighPay Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Hello, {user.name}! ({user.email})
          </Typography>
        </Box>
        <Button variant="outlined" onClick={onLogout}>
          Logout
        </Button>
      </Box>

      {/* Dashboard Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Dashboard color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Dashboard</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Main overview and metrics
              </Typography>
              <Chip label="Active" color="success" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Time Tracking</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Clock in/out and time management
              </Typography>
              <Button size="small" variant="contained" sx={{ mt: 1 }}>
                Clock In
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Employees</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Manage team members
              </Typography>
              <Chip label="Coming Soon" color="warning" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payment color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Payroll</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Process payroll and payments
              </Typography>
              <Chip label="Coming Soon" color="warning" size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                🎉 Dashboard is Working!
              </Typography>
              <Typography variant="body1" paragraph>
                The basic dashboard structure is now functional. This simplified version demonstrates:
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2">• User authentication flow</Typography>
                <Typography variant="body2">• Responsive Material-UI layout</Typography>
                <Typography variant="body2">• Card-based dashboard design</Typography>
                <Typography variant="body2">• Navigation structure</Typography>
              </Box>
              
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Next Steps:
                </Typography>
                <Typography variant="body2">
                  We can now gradually add back the advanced features like real-time WebSocket connections, 
                  full authentication system, time tracking, and analytics once we confirm this basic version works.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SimpleDashboard
