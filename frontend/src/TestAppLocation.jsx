import React from 'react';
import { LocationProvider, useLocation } from './contexts/LocationContext.simple';

function LocationTest() {
  const location = useLocation();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Location Context Test</h1>
      <div style={{ marginBottom: '20px' }}>
        <h3>Location Status:</h3>
        <p>Permission: {location.locationPermission}</p>
        <p>GPS Enabled: {location.gpsEnabled ? 'Yes' : 'No'}</p>
        <p>Getting Location: {location.isGettingLocation ? 'Yes' : 'No'}</p>
        <p>Current Location Valid: {location.currentLocationValid ? 'Yes' : 'No'}</p>
        {location.error && <p style={{ color: 'red' }}>Error: {location.error}</p>}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Location:</h3>
        {location.currentLocation ? (
          <pre>{JSON.stringify(location.currentLocation, null, 2)}</pre>
        ) : (
          <p>No location data</p>
        )}
      </div>
      
      <div>
        <button onClick={() => location.getCurrentLocation()}>
          Get Location
        </button>
        <button onClick={() => location.requestLocationPermission()}>
          Request Permission
        </button>
      </div>
    </div>
  );
}

function TestAppLocation() {
  return (
    <LocationProvider>
      <LocationTest />
    </LocationProvider>
  );
}

export default TestAppLocation;
