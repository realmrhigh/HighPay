import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { locationService } from '../services/locationService.mock';

const LocationContext = createContext();

const initialState = {
  currentLocation: null,
  locationPermission: 'prompt', // 'granted', 'denied', 'prompt'
  isGettingLocation: false,
  allowedLocations: [],
  currentLocationValid: false,
  error: null,
  gpsEnabled: false,
  wifiNetworks: [],
  nearbyWifi: []
};

function locationReducer(state, action) {
  switch (action.type) {
    case 'SET_LOCATION_PERMISSION':
      return { ...state, locationPermission: action.payload };
    case 'SET_GETTING_LOCATION':
      return { ...state, isGettingLocation: action.payload };
    case 'SET_CURRENT_LOCATION':
      return { 
        ...state, 
        currentLocation: action.payload,
        isGettingLocation: false,
        error: null
      };
    case 'SET_ALLOWED_LOCATIONS':
      return { ...state, allowedLocations: action.payload };
    case 'SET_LOCATION_VALID':
      return { ...state, currentLocationValid: action.payload };
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload, 
        isGettingLocation: false 
      };
    case 'SET_GPS_ENABLED':
      return { ...state, gpsEnabled: action.payload };
    case 'SET_WIFI_NETWORKS':
      return { ...state, wifiNetworks: action.payload };
    case 'SET_NEARBY_WIFI':
      return { ...state, nearbyWifi: action.payload };
    default:
      return state;
  }
}

export function LocationProvider({ children }) {
  const [state, dispatch] = useReducer(locationReducer, initialState);
  
  // Mock user for testing - normally this would come from useAuth()
  const user = { company_id: 1 };

  // Initialize location services
  useEffect(() => {
    if (user && user.company_id) {
      loadAllowedLocations();
      checkLocationPermission();
    }
  }, [user]);

  // Get current location
  const getCurrentLocation = async () => {
    dispatch({ type: 'SET_GETTING_LOCATION', payload: true });
    
    try {
      const position = await locationService.getCurrentPosition();
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ type: 'SET_CURRENT_LOCATION', payload: locationData });
      
      // Validate against allowed locations
      const isValid = await validateCurrentLocation(locationData);
      dispatch({ type: 'SET_LOCATION_VALID', payload: isValid });
      
      return locationData;
    } catch (error) {
      console.error('Error getting location:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Load allowed locations for the user's company
  const loadAllowedLocations = async () => {
    try {
      const locations = await locationService.getAllowedLocations(user.company_id);
      dispatch({ type: 'SET_ALLOWED_LOCATIONS', payload: locations });
    } catch (error) {
      console.error('Error loading allowed locations:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Check if current location is within allowed boundaries
  const validateCurrentLocation = async (location = state.currentLocation) => {
    if (!location || !state.allowedLocations.length) return false;

    try {
      // Check GPS geofencing
      const gpsValid = locationService.isLocationInGeofence(
        location,
        state.allowedLocations
      );

      if (gpsValid) {
        return true;
      }

      // Check WiFi if GPS validation fails
      const wifiValid = await checkWifiValidation();
      return wifiValid;
    } catch (error) {
      console.error('Error validating location:', error);
      return false;
    }
  };

  // Check WiFi-based validation
  const checkWifiValidation = async () => {
    try {
      // This is a simplified implementation
      // In a real app, you might use a different approach for WiFi detection
      const nearbyNetworks = await locationService.getNearbyWifiNetworks();
      dispatch({ type: 'SET_NEARBY_WIFI', payload: nearbyNetworks });

      const allowedWifiNetworks = state.allowedLocations.flatMap(loc => loc.wifi_ssids || []);
      const validNetwork = nearbyNetworks.some(network => 
        allowedWifiNetworks.includes(network.ssid)
      );

      return validNetwork;
    } catch (error) {
      console.error('Error checking WiFi:', error);
      return false;
    }
  };

  // Check location permission status
  const checkLocationPermission = async () => {
    try {
      const permission = await locationService.checkPermission();
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: permission });
      dispatch({ type: 'SET_GPS_ENABLED', payload: permission === 'granted' });
    } catch (error) {
      console.error('Error checking location permission:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const permission = await locationService.requestPermission();
      dispatch({ type: 'SET_LOCATION_PERMISSION', payload: permission });
      dispatch({ type: 'SET_GPS_ENABLED', payload: permission === 'granted' });
      return permission;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Watch location changes
  const watchLocation = (callback) => {
    return locationService.watchPosition((position) => {
      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ type: 'SET_CURRENT_LOCATION', payload: locationData });
      
      // Validate and call callback
      validateCurrentLocation(locationData).then(isValid => {
        dispatch({ type: 'SET_LOCATION_VALID', payload: isValid });
        callback({ location: locationData, isValid });
      });
    });
  };

  const value = {
    ...state,
    getCurrentLocation,
    validateCurrentLocation,
    checkLocationPermission,
    requestLocationPermission,
    watchLocation,
    loadAllowedLocations
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
