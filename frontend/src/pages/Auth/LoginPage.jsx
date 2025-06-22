import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  Container,
} from '@mui/material'
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login,
} from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
})

const LoginPage = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password)
    if (result.success) {
      navigate('/')
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.grey[50],
        backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.secondary.light}22)`,
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: theme.palette.primary.main,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              mx: 'auto',
              mb: 2,
              boxShadow: theme.shadows[8],
            }}
          >
            <Typography variant="h3" fontWeight="bold">
              H
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome to HighPay
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sign in to your account to continue
          </Typography>
        </Box>

        <Card
          sx={{
            maxWidth: 400,
            mx: 'auto',
            boxShadow: theme.shadows[8],
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom align="center">
              Sign In
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                {...register('email')}
                fullWidth
                label="Email Address"
                type="email"
                autoComplete="email"
                autoFocus
                margin="normal"
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                {...register('password')}
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                margin="normal"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting || loading}
                startIcon={
                  isSubmitting || loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Login />
                  )
                }
                sx={{
                  mb: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                {isSubmitting || loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Demo Credentials:
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Email: admin@company.com | Password: admin123
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Email: manager@company.com | Password: manager123
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Email: employee@company.com | Password: employee123
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Need help? Contact your system administrator
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default LoginPage
