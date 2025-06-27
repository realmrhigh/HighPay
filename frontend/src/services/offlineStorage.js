import localforage from 'localforage';

// Offline storage service using LocalForage
class OfflineStorageService {
  constructor() {
    this.store = null;
    this.isInitialized = false;
  }

  // Initialize the storage
  async initialize() {
    try {
      this.store = localforage.createInstance({
        name: 'HighPayOffline',
        storeName: 'data',
        version: 1.0,
        description: 'HighPay offline storage'
      });

      this.isInitialized = true;
      console.log('Offline storage initialized');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      throw error;
    }
  }

  // Ensure storage is initialized
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Offline storage not initialized');
    }
  }

  // Generic storage methods
  async setItem(key, value) {
    this.ensureInitialized();
    try {
      await this.store.setItem(key, value);
    } catch (error) {
      console.error('Error storing item:', error);
      throw error;
    }
  }

  async getItem(key) {
    this.ensureInitialized();
    try {
      return await this.store.getItem(key);
    } catch (error) {
      console.error('Error retrieving item:', error);
      return null;
    }
  }

  async removeItem(key) {
    this.ensureInitialized();
    try {
      await this.store.removeItem(key);
    } catch (error) {
      console.error('Error removing item:', error);
      throw error;
    }
  }

  async clear() {
    this.ensureInitialized();
    try {
      await this.store.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  // Pending operations management
  async getPendingOperations() {
    const operations = await this.getItem('pendingOperations');
    return operations || [];
  }

  async addPendingOperation(operation) {
    const operations = await this.getPendingOperations();
    operations.push(operation);
    await this.setItem('pendingOperations', operations);
  }

  async updatePendingOperation(updatedOperation) {
    const operations = await this.getPendingOperations();
    const index = operations.findIndex(op => op.id === updatedOperation.id);
    
    if (index !== -1) {
      operations[index] = updatedOperation;
      await this.setItem('pendingOperations', operations);
    }
  }

  async removePendingOperation(operationId) {
    const operations = await this.getPendingOperations();
    const filteredOperations = operations.filter(op => op.id !== operationId);
    await this.setItem('pendingOperations', filteredOperations);
  }

  // Time punch specific methods
  async storeTimePunch(timePunchData) {
    const key = `timePunch_${Date.now()}_${Math.random()}`;
    await this.setItem(key, {
      ...timePunchData,
      stored_at: new Date().toISOString(),
      synced: false
    });
    return key;
  }

  async getUnsyncedTimePunches() {
    const keys = await this.store.keys();
    const timePunchKeys = keys.filter(key => key.startsWith('timePunch_'));
    const timePunches = [];

    for (const key of timePunchKeys) {
      const data = await this.getItem(key);
      if (data && !data.synced) {
        timePunches.push({ key, ...data });
      }
    }

    return timePunches;
  }

  async markTimePunchSynced(key) {
    const data = await this.getItem(key);
    if (data) {
      data.synced = true;
      data.synced_at = new Date().toISOString();
      await this.setItem(key, data);
    }
  }

  async removeTimePunch(key) {
    await this.removeItem(key);
  }

  // Cache management for read-only data
  async cacheEmployees(employees) {
    await this.setItem('cached_employees', {
      data: employees,
      cached_at: new Date().toISOString()
    });
  }

  async getCachedEmployees() {
    const cached = await this.getItem('cached_employees');
    if (cached && this.isCacheValid(cached.cached_at, 300000)) { // 5 minutes
      return cached.data;
    }
    return null;
  }

  async cacheLocations(locations) {
    await this.setItem('cached_locations', {
      data: locations,
      cached_at: new Date().toISOString()
    });
  }

  async getCachedLocations() {
    const cached = await this.getItem('cached_locations');
    if (cached && this.isCacheValid(cached.cached_at, 600000)) { // 10 minutes
      return cached.data;
    }
    return null;
  }

  async cacheSchedules(schedules) {
    await this.setItem('cached_schedules', {
      data: schedules,
      cached_at: new Date().toISOString()
    });
  }

  async getCachedSchedules() {
    const cached = await this.getItem('cached_schedules');
    if (cached && this.isCacheValid(cached.cached_at, 300000)) { // 5 minutes
      return cached.data;
    }
    return null;
  }

  // Check if cache is still valid
  isCacheValid(cachedAt, maxAge) {
    const now = new Date().getTime();
    const cached = new Date(cachedAt).getTime();
    return (now - cached) < maxAge;
  }

  // Storage usage calculation
  async getStorageUsage() {
    try {
      const keys = await this.store.keys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await this.getItem(key);
        if (value) {
          // Rough estimation of storage size
          totalSize += JSON.stringify(value).length * 2; // UTF-16 encoding
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return 0;
    }
  }

  // Clear all data
  async clearAll() {
    await this.clear();
  }

  // Clear only cached data (keep pending operations)
  async clearCache() {
    const keys = await this.store.keys();
    const cacheKeys = keys.filter(key => key.startsWith('cached_'));
    
    for (const key of cacheKeys) {
      await this.removeItem(key);
    }
  }

  // Export data for debugging
  async exportData() {
    try {
      const keys = await this.store.keys();
      const data = {};

      for (const key of keys) {
        data[key] = await this.getItem(key);
      }

      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return {};
    }
  }

  // User preferences
  async setUserPreference(key, value) {
    const preferences = await this.getItem('user_preferences') || {};
    preferences[key] = value;
    await this.setItem('user_preferences', preferences);
  }

  async getUserPreference(key, defaultValue = null) {
    const preferences = await this.getItem('user_preferences') || {};
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  }

  // Connection state tracking
  async setLastOnlineTime(timestamp = new Date().toISOString()) {
    await this.setItem('last_online_time', timestamp);
  }

  async getLastOnlineTime() {
    return await this.getItem('last_online_time');
  }

  async setLastSyncTime(timestamp = new Date().toISOString()) {
    await this.setItem('last_sync_time', timestamp);
  }

  async getLastSyncTime() {
    return await this.getItem('last_sync_time');
  }
}

export const offlineStorage = new OfflineStorageService();
