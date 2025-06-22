import React from 'react'
import { Box, Typography, Card, CardContent, Grid } from '@mui/material'

const DashboardPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        HighPay Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Employees
              </Typography>
              <Typography variant="h4">
                42
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Clock-ins
              </Typography>
              <Typography variant="h4">
                8
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                This Month Payroll
              </Typography>
              <Typography variant="h4">
                $125,340
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Pending Approvals
              </Typography>
              <Typography variant="h4">
                3
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Welcome to HighPay Dashboard!
        </Typography>
        <Typography variant="body1">
          Your modern payroll management system is ready to use.
        </Typography>
      </Box>
    </Box>
  )
}

export default DashboardPage
