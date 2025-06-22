import React from 'react'
import { Box, Typography, Card, CardContent, Button, Chip } from '@mui/material'
import { Person, Edit } from '@mui/icons-material'

const ProfilePage = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your personal information and preferences
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Edit />}>
          Edit Profile
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            User Profile
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Manage your profile including:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
            <Chip label="Personal Information" variant="outlined" />
            <Chip label="Contact Details" variant="outlined" />
            <Chip label="Password Change" variant="outlined" />
            <Chip label="Notification Settings" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Profile management coming soon!
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ProfilePage
