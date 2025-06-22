import React from 'react'
import { Box, Typography, Card, CardContent, Grid } from '@mui/material'

function SimpleDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        HighPay Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Employees
              </Typography>
              <Typography variant="h4">
                42
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="secondary">
                Payroll
              </Typography>
              <Typography variant="h4">
                $125,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                Hours Tracked
              </Typography>
              <Typography variant="h4">
                1,680
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                Pending Tasks
              </Typography>
              <Typography variant="h4">
                7
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default SimpleDashboard
