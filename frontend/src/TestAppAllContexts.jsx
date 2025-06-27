import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.simple';
import { OfflineProvider, useOffline } from './contexts/OfflineContext';
import { LocationProvider, useLocation } from './contexts/LocationContext.simple';

function TestAllContexts() {
  const auth = useAuth();
  const offline = useOffline();
  const location = useLocation();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>All Contexts Test</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd' }}>
        <h3>Auth Context:</h3>
        <p>Authenticated: {auth.isAuthenticated ? 'Yes' : 'No'}</p>
        <p>Loading: {auth.loading ? 'Yes' : 'No'}</p>
        <p>User: {auth.user ? auth.user.name : 'None'}</p>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd' }}>
        <h3>Offline Context:</h3>
        <p>Online: {offline.isOnline ? 'Yes' : 'No'}</p>
        <p>Sync Needed: {offline.needsSync ? 'Yes' : 'No'}</p>
        <p>Offline Actions: {offline.offlineActions.length}</p>
        <p>Connection Quality: {offline.connectionQuality}</p>
      </div>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd' }}>
        <h3>Location Context:</h3>
        <p>Permission: {location.locationPermission}</p>
        <p>GPS Enabled: {location.gpsEnabled ? 'Yes' : 'No'}</p>
        <p>Getting Location: {location.isGettingLocation ? 'Yes' : 'No'}</p>
        <p>Location Valid: {location.currentLocationValid ? 'Yes' : 'No'}</p>
        {location.error && <p style={{ color: 'red' }}>Error: {location.error}</p>}
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Actions:</h3>
        <button onClick={() => auth.login({ email: 'test@example.com', password: 'test' })}>
          Login
        </button>
        <button onClick={() => offline.addOfflineAction({ type: 'TEST', data: 'test' })}>
          Add Offline Action
        </button>
        <button onClick={() => location.getCurrentLocation()} style={{ marginLeft: '10px' }}>
          Get Location
        </button>
      </div>
      
      <div style={{ fontSize: '12px', color: '#666' }}>
        <p>✅ All three contexts are working together!</p>
        <p>Auth: {auth.isAuthenticated ? '✓' : '✗'}</p>
        <p>Offline: {offline.isOnline ? '✓' : '✗'}</p>
        <p>Location: {location.locationPermission !== 'denied' ? '✓' : '✗'}</p>
      </div>
    </div>
  );
}

function TestAppAllContexts() {
  return (
    <AuthProvider>
      <OfflineProvider>
        <LocationProvider>
          <TestAllContexts />
        </LocationProvider>
      </OfflineProvider>
    </AuthProvider>
  );
}

export default TestAppAllContexts;
