import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Payment, PlaylistAdd } from '@mui/icons-material'

const PayrollPage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Payroll Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Process payroll, manage pay periods, and generate reports
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PlaylistAdd />}>
          New Payroll Run
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Payment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Payroll Processing
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Complete payroll management system featuring:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Payroll Runs" variant="outlined" />
            <Chip label="Tax Calculations" variant="outlined" />
            <Chip label="Deductions" variant="outlined" />
            <Chip label="Direct Deposit" variant="outlined" />
            <Chip label="Payroll Reports" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Full payroll processing capabilities coming soon!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default PayrollPage
