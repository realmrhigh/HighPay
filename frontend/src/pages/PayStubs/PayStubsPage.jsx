import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Receipt, Download } from '@mui/icons-material'

const PayStubsPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Pay Stubs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and download your pay stubs
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Download />}>
          Download Latest
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Digital Pay Stubs
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Access your pay stubs with features like:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Chip label="PDF Downloads" variant="outlined" />
            <Chip label="Pay History" variant="outlined" />
            <Chip label="Tax Documents" variant="outlined" />
            <Chip label="Email Delivery" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Pay stub management coming soon!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PayStubsPage
