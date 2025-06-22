import React from 'react'
import { Box, CircularProgress, Typography, useTheme } from '@mui/material'

const LoadingScreen = ({ message = 'Loading...' }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        gap: 3,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 32,
            height: 32,
            bgcolor: theme.palette.primary.main,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            H
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          HighPay
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Box>
  )
}

export default LoadingScreen
