import React from 'react'
import { Box, Typography, Button, useTheme } from '@mui/material'
import { Home, ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
  const theme = useTheme()
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: '8rem',
          fontWeight: 'bold',
          color: theme.palette.primary.main,
          mb: 2,
        }}
      >
        404
      </Typography>
      
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Page Not Found
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500 }}>
        The page you're looking for doesn't exist or has been moved. 
        Let's get you back to where you need to be.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          variant="contained"
          startIcon={<Home />}
          onClick={() => navigate('/')}
          size="large"
        >
          Go to Dashboard
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          size="large"
        >
          Go Back
        </Button>
      </Box>
    </Box>
  )
}

export default NotFoundPage
