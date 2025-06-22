import React from 'react'
import { Box, Typography, Button } from '@mui/material'

function TestApp() {
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h3" gutterBottom>
        HighPay Dashboard Test
      </Typography>
      <Typography variant="body1" paragraph>
        If you can see this, React is working!
      </Typography>
      <Button variant="contained" color="primary">
        Test Button
      </Button>
    </Box>
  )
}

export default TestApp
