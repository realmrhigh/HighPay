// Geolocation utility functions
export const geolocation = {
  // Default options for geolocation requests
  defaultOptions: {
    enableHighAccuracy: true,
    timeout: 10000, // 10 seconds
    maximumAge: 60000 // 1 minute cache
  },

  // Check if geolocation is supported
  isSupported() {
    return 'geolocation' in navigator;
  },

  // Get current position with promise wrapper
  async getCurrentPosition(options = {}) {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const opts = { ...this.defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(this.handleGeolocationError(error)),
        opts
      );
    });
  },

  // Watch position with promise wrapper
  watchPosition(successCallback, errorCallback, options = {}) {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    const opts = { ...this.defaultOptions, ...options };

    return navigator.geolocation.watchPosition(
      successCallback,
      errorCallback || ((error) => console.error('Geolocation error:', this.handleGeolocationError(error))),
      opts
    );
  },

  // Clear watch
  clearWatch(watchId) {
    if (watchId !== null && watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  // Handle geolocation errors
  handleGeolocationError(error) {
    let message = 'Unknown geolocation error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        break;
    }

    return new Error(message);
  },

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  },

  // Check if point is within radius of another point
  isWithinRadius(lat1, lon1, lat2, lon2, radius) {
    const distance = this.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radius;
  },

  // Check if location is within any of the allowed geofences
  isLocationInGeofences(userLocation, geofences) {
    if (!userLocation || !geofences || geofences.length === 0) {
      return false;
    }

    return geofences.some(geofence => {
      return this.isWithinRadius(
        userLocation.latitude,
        userLocation.longitude,
        geofence.latitude,
        geofence.longitude,
        geofence.radius
      );
    });
  },

  // Format coordinates for display
  formatCoordinates(latitude, longitude, precision = 6) {
    return {
      latitude: parseFloat(latitude.toFixed(precision)),
      longitude: parseFloat(longitude.toFixed(precision)),
      formatted: `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`
    };
  },

  // Convert degrees to radians
  toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  },

  // Convert radians to degrees
  toDegrees(radians) {
    return (radians * 180) / Math.PI;
  },

  // Calculate bearing between two points
  calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δλ = this.toRadians(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (this.toDegrees(θ) + 360) % 360; // Normalize to 0-360°
  },

  // Get address from coordinates (reverse geocoding)
  async getAddressFromCoordinates(latitude, longitude) {
    try {
      // This would typically use a geocoding service like Google Maps API
      // For demo purposes, we'll return a placeholder
      return {
        formatted_address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        city: 'Unknown',
        state: 'Unknown',
        country: 'Unknown'
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  },

  // Get coordinates from address (forward geocoding)
  async getCoordinatesFromAddress(address) {
    try {
      // This would typically use a geocoding service
      // For demo purposes, we'll return null
      return null;
    } catch (error) {
      console.error('Forward geocoding failed:', error);
      return null;
    }
  },

  // Validate coordinate values
  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180 &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    );
  },

  // Get accuracy level description
  getAccuracyDescription(accuracy) {
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    if (accuracy <= 20) return 'Fair';
    if (accuracy <= 50) return 'Poor';
    return 'Very Poor';
  },

  // Check if location accuracy is acceptable
  isAccuracyAcceptable(accuracy, requiredAccuracy = 20) {
    return accuracy <= requiredAccuracy;
  },

  // Mock location for development/testing
  getMockLocation() {
    return {
      coords: {
        latitude: 40.7128, // New York City
        longitude: -74.0060,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    };
  },

  // Create geofence object
  createGeofence(latitude, longitude, radius, name = '') {
    if (!this.isValidCoordinate(latitude, longitude)) {
      throw new Error('Invalid coordinates for geofence');
    }

    if (radius <= 0) {
      throw new Error('Geofence radius must be positive');
    }

    return {
      latitude,
      longitude,
      radius,
      name,
      created_at: new Date().toISOString()
    };
  },

  // Calculate geofence area
  calculateGeofenceArea(radius) {
    return Math.PI * Math.pow(radius, 2); // Area in square meters
  },

  // Check if two geofences overlap
  doGeofencesOverlap(geofence1, geofence2) {
    const distance = this.calculateDistance(
      geofence1.latitude,
      geofence1.longitude,
      geofence2.latitude,
      geofence2.longitude
    );

    return distance < (geofence1.radius + geofence2.radius);
  },

  // Get the closest geofence to a location
  getClosestGeofence(location, geofences) {
    if (!geofences || geofences.length === 0) return null;

    let closest = null;
    let minDistance = Infinity;

    geofences.forEach(geofence => {
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        geofence.latitude,
        geofence.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = { ...geofence, distance };
      }
    });

    return closest;
  },

  // Format distance for display
  formatDistance(distanceInMeters) {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else if (distanceInMeters < 10000) {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(distanceInMeters / 1000)}km`;
    }
  },

  // Check if device is moving based on location updates
  isDeviceMoving(currentLocation, previousLocation, threshold = 5) {
    if (!previousLocation) return false;

    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      previousLocation.latitude,
      previousLocation.longitude
    );

    return distance > threshold;
  },

  // Calculate speed between two location points
  calculateSpeed(location1, location2) {
    if (!location1 || !location2 || !location1.timestamp || !location2.timestamp) {
      return 0;
    }

    const distance = this.calculateDistance(
      location1.latitude,
      location1.longitude,
      location2.latitude,
      location2.longitude
    );

    const timeDiff = Math.abs(location2.timestamp - location1.timestamp) / 1000; // seconds
    
    if (timeDiff === 0) return 0;

    return distance / timeDiff; // meters per second
  }
};
