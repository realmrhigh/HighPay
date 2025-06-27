// Sync service for background synchronization
class SyncService {
  constructor() {
    this.syncInterval = null;
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second delay
  }

  // Start periodic sync
  startPeriodicSync(interval, syncCallback) {
    this.stopPeriodicSync(); // Clear any existing interval
    
    this.syncInterval = setInterval(() => {
      if (!this.isProcessing && navigator.onLine) {
        syncCallback();
      }
    }, interval);
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sync operations with the server
  async syncOperations(operations) {
    if (this.isProcessing) {
      return [];
    }

    this.isProcessing = true;
    const results = [];

    try {
      for (const operation of operations) {
        try {
          const result = await this.syncSingleOperation(operation);
          results.push({
            operationId: operation.id,
            success: true,
            result
          });
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);
          results.push({
            operationId: operation.id,
            success: false,
            error: error.message
          });
        }
      }
    } finally {
      this.isProcessing = false;
    }

    return results;
  }

  // Sync a single operation
  async syncSingleOperation(operation) {
    const { type, data, method, endpoint } = operation;

    switch (type) {
      case 'TIME_PUNCH':
        return await this.syncTimePunch(data);
      case 'CORRECTION_REQUEST':
        return await this.syncCorrectionRequest(data);
      case 'PROFILE_UPDATE':
        return await this.syncProfileUpdate(data);
      case 'GENERIC_API':
        return await this.syncGenericApi(method, endpoint, data);
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  // Sync time punch
  async syncTimePunch(timePunchData) {
    const response = await fetch('/api/time-tracking/punch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(timePunchData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync time punch');
    }

    return await response.json();
  }

  // Sync correction request
  async syncCorrectionRequest(correctionData) {
    const response = await fetch('/api/corrections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(correctionData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync correction request');
    }

    return await response.json();
  }

  // Sync profile update
  async syncProfileUpdate(profileData) {
    const response = await fetch(`/api/users/${profileData.user_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync profile update');
    }

    return await response.json();
  }

  // Sync generic API call
  async syncGenericApi(method, endpoint, data) {
    const options = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    };

    if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `Failed to sync ${method} ${endpoint}`);
    }

    return await response.json();
  }

  // Get authentication token
  getAuthToken() {
    return localStorage.getItem('token') || '';
  }

  // Batch sync with retry logic
  async batchSyncWithRetry(operations, retryCount = 0) {
    try {
      return await this.batchSync(operations);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Batch sync failed, retrying in ${delay}ms...`);
        
        await this.sleep(delay);
        return await this.batchSyncWithRetry(operations, retryCount + 1);
      } else {
        throw new Error(`Batch sync failed after ${this.maxRetries} retries: ${error.message}`);
      }
    }
  }

  // Batch sync operations
  async batchSync(operations) {
    const response = await fetch('/api/sync/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({ operations })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Batch sync failed');
    }

    return await response.json();
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check server connectivity
  async checkConnectivity() {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.error('Connectivity check failed:', error);
      return false;
    }
  }

  // Sync specific data types
  async syncUserData(userData) {
    const response = await fetch('/api/sync/user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to sync user data');
    }

    return await response.json();
  }

  // Force full sync
  async forceFullSync() {
    const response = await fetch('/api/sync/full', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to perform full sync');
    }

    return await response.json();
  }

  // Get sync status from server
  async getSyncStatus() {
    const response = await fetch('/api/sync/status', {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get sync status');
    }

    return await response.json();
  }

  // Conflict resolution
  async resolveConflicts(conflicts) {
    const response = await fetch('/api/sync/resolve-conflicts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({ conflicts })
    });

    if (!response.ok) {
      throw new Error('Failed to resolve conflicts');
    }

    return await response.json();
  }

  // Priority-based sync (sync important operations first)
  async prioritySync(operations) {
    // Sort operations by priority (TIME_PUNCH has highest priority)
    const priorityOrder = {
      'TIME_PUNCH': 1,
      'CORRECTION_REQUEST': 2,
      'PROFILE_UPDATE': 3,
      'GENERIC_API': 4
    };

    const sortedOperations = operations.sort((a, b) => {
      const priorityA = priorityOrder[a.type] || 999;
      const priorityB = priorityOrder[b.type] || 999;
      return priorityA - priorityB;
    });

    return await this.syncOperations(sortedOperations);
  }
}

export const syncService = new SyncService();
