// Location service for GPS and WiFi validation
class LocationService {
  constructor() {
    this.watchId = null;
    this.options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // 1 minute cache
    };
  }

  // Check if geolocation is supported
  isSupported() {
    return 'geolocation' in navigator;
  }

  // Check current permission status
  async checkPermission() {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      return 'prompt';
    }
  }

  // Request location permission
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve('denied');
          } else {
            reject(new Error(`Location error: ${error.message}`));
          }
        },
        this.options
      );
    });
  }

  // Get current position
  async getCurrentPosition() {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          let errorMessage = 'Unknown location error';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        this.options
      );
    });
  }

  // Watch position changes
  watchPosition(callback, errorCallback) {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    this.watchId = navigator.geolocation.watchPosition(
      callback,
      errorCallback || ((error) => console.error('Location watch error:', error)),
      this.options
    );

    return this.watchId;
  }

  // Stop watching position
  clearWatch() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Check if location is within geofence
  isLocationInGeofence(userLocation, allowedLocations) {
    if (!userLocation || !allowedLocations.length) {
      return false;
    }

    return allowedLocations.some(location => {
      if (!location.geofence_lat || !location.geofence_lon || !location.geofence_radius) {
        return false;
      }

      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.geofence_lat,
        location.geofence_lon
      );

      return distance <= location.geofence_radius;
    });
  }

  // Get nearby WiFi networks (simplified implementation)
  async getNearbyWifiNetworks() {
    // Note: This is a simplified implementation
    // In a real app, you might use a different approach or native mobile APIs
    
    try {
      // This would typically require native mobile app capabilities
      // For web apps, we'll simulate or use alternative approaches
      
      if ('wifi' in navigator) {
        // Hypothetical API - not actually available in browsers
        return await navigator.wifi.scan();
      }
      
      // Fallback: return empty array or cached networks
      return [];
    } catch (error) {
      console.warn('WiFi scanning not available:', error);
      return [];
    }
  }

  // API calls for location management
  async getAllowedLocations(companyId) {
    try {
      const response = await fetch(`/api/locations?company_id=${companyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch allowed locations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching allowed locations:', error);
      throw error;
    }
  }

  // Create a new location
  async createLocation(locationData) {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(locationData)
      });

      if (!response.ok) {
        throw new Error('Failed to create location');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  // Update location
  async updateLocation(locationId, locationData) {
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(locationData)
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  // Delete location
  async deleteLocation(locationId) {
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }

      return true;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  // Validate location for time punch
  async validateLocationForTimePunch(location) {
    try {
      const response = await fetch('/api/locations/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(location)
      });

      if (!response.ok) {
        throw new Error('Failed to validate location');
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating location:', error);
      throw error;
    }
  }

  // Get location history for a user
  async getLocationHistory(userId, startDate, endDate) {
    try {
      const params = new URLSearchParams({
        user_id: userId,
        start_date: startDate,
        end_date: endDate
      });

      const response = await fetch(`/api/locations/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch location history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching location history:', error);
      throw error;
    }
  }
}

export const locationService = new LocationService();
