import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  LocationOn,
  LocationOff,
  GpsFixed,
  GpsNotFixed,
  Wifi,
  WifiOff,
  Refresh,
  CheckCircle,
  Error,
  Warning,
  Map
} from '@mui/icons-material';
import { useLocation } from '../../contexts/LocationContext';
import { geolocation } from '../../utils/geolocation';

export function LocationValidation({ onValidationChange, showMap = false }) {
  const {
    currentLocation,
    locationPermission,
    isGettingLocation,
    allowedLocations,
    currentLocationValid,
    error,
    getCurrentLocation,
    requestLocationPermission,
    validateCurrentLocation
  } = useLocation();

  const [validationInProgress, setValidationInProgress] = useState(false);
  const [closestLocation, setClosestLocation] = useState(null);

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(currentLocationValid);
    }
  }, [currentLocationValid, onValidationChange]);

  useEffect(() => {
    if (currentLocation && allowedLocations.length > 0) {
      const closest = geolocation.getClosestGeofence(currentLocation, allowedLocations);
      setClosestLocation(closest);
    }
  }, [currentLocation, allowedLocations]);

  const handleGetLocation = async () => {
    setValidationInProgress(true);
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setValidationInProgress(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      await requestLocationPermission();
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
  };

  const getPermissionStatus = () => {
    switch (locationPermission) {
      case 'granted':
        return { icon: <GpsFixed />, text: 'Granted', color: 'success' };
      case 'denied':
        return { icon: <GpsNotFixed />, text: 'Denied', color: 'error' };
      default:
        return { icon: <LocationOff />, text: 'Not Requested', color: 'warning' };
    }
  };

  const getValidationStatus = () => {
    if (!currentLocation) {
      return { icon: <LocationOff />, text: 'Location Unknown', color: 'warning' };
    }
    
    if (currentLocationValid) {
      return { icon: <CheckCircle />, text: 'Location Valid', color: 'success' };
    }
    
    return { icon: <Error />, text: 'Location Invalid', color: 'error' };
  };

  const formatAccuracy = (accuracy) => {
    if (!accuracy) return 'Unknown';
    return `±${Math.round(accuracy)}m (${geolocation.getAccuracyDescription(accuracy)})`;
  };

  const formatCoordinates = (lat, lon) => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  const permissionStatus = getPermissionStatus();
  const validationStatus = getValidationStatus();

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Location Validation</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={permissionStatus.icon}
              label={permissionStatus.text}
              color={permissionStatus.color}
              size="small"
            />
            <Chip
              icon={validationStatus.icon}
              label={validationStatus.text}
              color={validationStatus.color}
              size="small"
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {locationPermission === 'denied' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Location access is required for time tracking. Please enable location permissions in your browser settings.
          </Alert>
        )}

        {locationPermission === 'prompt' && (
          <Alert severity="info" sx={{ mb: 2 }} 
                action={
                  <Button color="inherit" size="small" onClick={handleRequestPermission}>
                    Grant Permission
                  </Button>
                }>
            We need access to your location to validate your work location.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={isGettingLocation || validationInProgress ? <CircularProgress size={16} /> : <GpsFixed />}
            onClick={handleGetLocation}
            disabled={locationPermission === 'denied' || isGettingLocation || validationInProgress}
            fullWidth
          >
            {isGettingLocation || validationInProgress ? 'Getting Location...' : 'Get Current Location'}
          </Button>
          
          <Tooltip title="Refresh location">
            <IconButton
              onClick={handleGetLocation}
              disabled={locationPermission === 'denied' || isGettingLocation || validationInProgress}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>

        {(isGettingLocation || validationInProgress) && (
          <LinearProgress sx={{ mb: 2 }} />
        )}

        {currentLocation && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Location
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
              </Typography>
              {currentLocation.accuracy && (
                <Typography variant="body2" color="text.secondary">
                  Accuracy: {formatAccuracy(currentLocation.accuracy)}
                </Typography>
              )}
              {currentLocation.timestamp && (
                <Typography variant="body2" color="text.secondary">
                  Updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {closestLocation && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Closest Work Location
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                {closestLocation.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Distance: {geolocation.formatDistance(closestLocation.distance)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Radius: {geolocation.formatDistance(closestLocation.radius)}
              </Typography>
            </Box>
          </Box>
        )}

        {allowedLocations.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Allowed Work Locations ({allowedLocations.length})
            </Typography>
            <List dense>
              {allowedLocations.map((location, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <Map />
                  </ListItemIcon>
                  <ListItemText
                    primary={location.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {formatCoordinates(location.geofence_lat, location.geofence_lon)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Radius: {geolocation.formatDistance(location.geofence_radius)}
                        </Typography>
                        {location.wifi_ssids && location.wifi_ssids.length > 0 && (
                          <Typography variant="caption" display="block">
                            <Wifi sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 12 }} />
                            WiFi: {location.wifi_ssids.join(', ')}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {allowedLocations.length === 0 && (
          <Alert severity="info">
            No work locations configured. Please contact your administrator to set up work locations.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
