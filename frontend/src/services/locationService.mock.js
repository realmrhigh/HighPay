// Mock Location service for testing (no API calls)
class MockLocationService {
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
        (position) => resolve(position),
        (error) => reject(new Error(`Location error: ${error.message}`)),
        this.options
      );
    });
  }

  // Watch position changes
  watchPosition(callback) {
    if (!this.isSupported()) {
      throw new Error('Geolocation is not supported by this browser');
    }

    this.watchId = navigator.geolocation.watchPosition(
      callback,
      (error) => console.error('Watch position error:', error),
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

  // Mock API calls - return dummy data instead of making real API calls
  async getAllowedLocations(companyId) {
    // Return mock allowed locations
    return [
      {
        id: 1,
        name: 'Main Office',
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 100, // meters
        wifi_ssids: ['OfficeWiFi', 'OfficeGuest']
      },
      {
        id: 2,
        name: 'Branch Office',
        latitude: 40.7829,
        longitude: -73.9654,
        radius: 50,
        wifi_ssids: ['BranchWiFi']
      }
    ];
  }

  // Mock WiFi networks
  async getNearbyWifiNetworks() {
    // Return mock WiFi networks
    return [
      { ssid: 'OfficeWiFi', strength: -45 },
      { ssid: 'PublicWiFi', strength: -60 },
      { ssid: 'NeighborWiFi', strength: -75 }
    ];
  }

  // Check if location is within geofence
  isLocationInGeofence(currentLocation, allowedLocations) {
    if (!currentLocation || !allowedLocations.length) return false;

    return allowedLocations.some(location => {
      const distance = this.calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        location.latitude,
        location.longitude
      );
      return distance <= (location.radius || 100); // default 100m radius
    });
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(value) {
    return value * Math.PI / 180;
  }
}

export const locationService = new MockLocationService();
