import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Tooltip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Wifi,
  Map as MapIcon,
  Visibility,
  GpsFixed
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { locationService } from '../../services/locationService';
import { geolocation } from '../../utils/geolocation';
import { LocationValidation } from '../../components/LocationValidation';

export function LocationsPage() {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    geofence_lat: '',
    geofence_lon: '',
    geofence_radius: 100,
    wifi_ssids: ['']
  });

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await locationService.getAllowedLocations(user.company_id);
      setLocations(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address || '',
        geofence_lat: location.geofence_lat || '',
        geofence_lon: location.geofence_lon || '',
        geofence_radius: location.geofence_radius || 100,
        wifi_ssids: location.wifi_ssids || ['']
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        geofence_lat: '',
        geofence_lon: '',
        geofence_radius: 100,
        wifi_ssids: ['']
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLocation(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWifiSsidChange = (index, value) => {
    const newSsids = [...formData.wifi_ssids];
    newSsids[index] = value;
    setFormData(prev => ({
      ...prev,
      wifi_ssids: newSsids
    }));
  };

  const handleAddWifiSsid = () => {
    setFormData(prev => ({
      ...prev,
      wifi_ssids: [...prev.wifi_ssids, '']
    }));
  };

  const handleRemoveWifiSsid = (index) => {
    if (formData.wifi_ssids.length > 1) {
      const newSsids = formData.wifi_ssids.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        wifi_ssids: newSsids
      }));
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const position = await geolocation.getCurrentPosition();
      setFormData(prev => ({
        ...prev,
        geofence_lat: position.coords.latitude.toString(),
        geofence_lon: position.coords.longitude.toString()
      }));
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      const locationData = {
        ...formData,
        company_id: user.company_id,
        geofence_lat: parseFloat(formData.geofence_lat),
        geofence_lon: parseFloat(formData.geofence_lon),
        geofence_radius: parseInt(formData.geofence_radius),
        wifi_ssids: formData.wifi_ssids.filter(ssid => ssid.trim() !== '')
      };

      if (editingLocation) {
        await locationService.updateLocation(editingLocation.id, locationData);
      } else {
        await locationService.createLocation(locationData);
      }

      await loadLocations();
      handleCloseDialog();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      await locationService.deleteLocation(locationToDelete.id);
      await loadLocations();
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const formatCoordinates = (lat, lon) => {
    if (!lat || !lon) return 'Not set';
    return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
  };

  if (loading) {
    return <Box p={3}>Loading locations...</Box>;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Work Locations</Typography>
        {user.permission_role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Location
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {locations.map((location) => (
          <Grid item xs={12} md={6} lg={4} key={location.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {location.name}
                </Typography>
                
                {location.address && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {location.address}
                  </Typography>
                )}

                <Box mt={2} mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Geofence
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {formatCoordinates(location.geofence_lat, location.geofence_lon)}
                  </Typography>
                  {location.geofence_radius && (
                    <Typography variant="body2" color="text.secondary">
                      Radius: {geolocation.formatDistance(location.geofence_radius)}
                    </Typography>
                  )}
                </Box>

                {location.wifi_ssids && location.wifi_ssids.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      WiFi Networks
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {location.wifi_ssids.map((ssid, index) => (
                        <Chip
                          key={index}
                          icon={<Wifi />}
                          label={ssid}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>

              {user.permission_role === 'admin' && (
                <CardActions>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(location)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setLocationToDelete(location);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      {locations.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No work locations have been configured yet.
          {user.permission_role === 'admin' && ' Click "Add Location" to create your first location.'}
        </Alert>
      )}

      {/* Location Validation Component */}
      <Box mt={4}>
        <LocationValidation />
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Location Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Address (Optional)"
              value={formData.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            <Typography variant="h6">Geofence Configuration</Typography>

            <Box display="flex" gap={2} alignItems="center">
              <TextField
                label="Latitude"
                type="number"
                value={formData.geofence_lat}
                onChange={(e) => handleFormChange('geofence_lat', e.target.value)}
                inputProps={{ step: 'any' }}
                fullWidth
              />
              <TextField
                label="Longitude"
                type="number"
                value={formData.geofence_lon}
                onChange={(e) => handleFormChange('geofence_lon', e.target.value)}
                inputProps={{ step: 'any' }}
                fullWidth
              />
              <Tooltip title="Use current location">
                <IconButton onClick={handleGetCurrentLocation}>
                  <GpsFixed />
                </IconButton>
              </Tooltip>
            </Box>

            <TextField
              label="Radius (meters)"
              type="number"
              value={formData.geofence_radius}
              onChange={(e) => handleFormChange('geofence_radius', e.target.value)}
              fullWidth
              inputProps={{ min: 10, max: 10000 }}
            />

            <Typography variant="h6">WiFi Networks (Optional)</Typography>
            <Typography variant="body2" color="text.secondary">
              Add WiFi network names (SSIDs) that can be used as alternative location validation.
            </Typography>

            {formData.wifi_ssids.map((ssid, index) => (
              <Box key={index} display="flex" gap={1} alignItems="center">
                <TextField
                  label={`WiFi Network ${index + 1}`}
                  value={ssid}
                  onChange={(e) => handleWifiSsidChange(index, e.target.value)}
                  fullWidth
                />
                {formData.wifi_ssids.length > 1 && (
                  <IconButton onClick={() => handleRemoveWifiSsid(index)}>
                    <Delete />
                  </IconButton>
                )}
              </Box>
            ))}

            <Button
              startIcon={<Add />}
              onClick={handleAddWifiSsid}
              variant="outlined"
              size="small"
            >
              Add WiFi Network
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingLocation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Location</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
