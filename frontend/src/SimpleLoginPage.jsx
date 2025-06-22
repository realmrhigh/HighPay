import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
} from '@mui/material'

const SimpleLoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    // Simulate login
    setTimeout(() => {
      if (email.includes('@') && password.length >= 6) {
        onLogin({ email, name: 'Demo User' })
      } else {
        setError('Invalid credentials. Try: admin@company.com / admin123')
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ maxWidth: 400, mx: 'auto' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom color="primary">
              HighPay Login
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                placeholder="admin@company.com"
              />
              
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                placeholder="admin123"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <Typography variant="body2" color="text.secondary" align="center">
              Demo: admin@company.com / admin123
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default SimpleLoginPage
