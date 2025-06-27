import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { offlineStorage } from '../services/offlineStorage';
import { syncService } from '../services/syncService';

const OfflineContext = createContext();

const initialState = {
  isOnline: navigator.onLine,
  syncInProgress: false,
  pendingOperations: [],
  lastSyncTime: null,
  syncError: null,
  storageUsage: 0,
  maxStorage: 50 * 1024 * 1024, // 50MB default
  autoSyncEnabled: true,
  syncInterval: 30000 // 30 seconds
};

function offlineReducer(state, action) {
  switch (action.type) {
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    case 'SET_SYNC_IN_PROGRESS':
      return { ...state, syncInProgress: action.payload };
    case 'SET_PENDING_OPERATIONS':
      return { ...state, pendingOperations: action.payload };
    case 'ADD_PENDING_OPERATION':
      return { 
        ...state, 
        pendingOperations: [...state.pendingOperations, action.payload] 
      };
    case 'REMOVE_PENDING_OPERATION':
      return { 
        ...state, 
        pendingOperations: state.pendingOperations.filter(op => op.id !== action.payload) 
      };
    case 'SET_LAST_SYNC_TIME':
      return { ...state, lastSyncTime: action.payload };
    case 'SET_SYNC_ERROR':
      return { ...state, syncError: action.payload };
    case 'SET_STORAGE_USAGE':
      return { ...state, storageUsage: action.payload };
    case 'SET_AUTO_SYNC':
      return { ...state, autoSyncEnabled: action.payload };
    default:
      return state;
  }
}

export function OfflineProvider({ children }) {
  const [state, dispatch] = useReducer(offlineReducer, initialState);

  // Initialize offline functionality
  useEffect(() => {
    initializeOfflineMode();
    setupEventListeners();
    loadPendingOperations();
    
    return () => {
      cleanupEventListeners();
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (state.isOnline && state.pendingOperations.length > 0 && state.autoSyncEnabled) {
      syncPendingOperations();
    }
  }, [state.isOnline, state.pendingOperations.length]);

  // Initialize offline storage
  const initializeOfflineMode = async () => {
    try {
      await offlineStorage.initialize();
      updateStorageUsage();
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Periodic sync when online
    if (state.autoSyncEnabled) {
      syncService.startPeriodicSync(state.syncInterval, syncPendingOperations);
    }
  };

  // Cleanup event listeners
  const cleanupEventListeners = () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    syncService.stopPeriodicSync();
  };

  // Handle coming online
  const handleOnline = () => {
    dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    dispatch({ type: 'SET_SYNC_ERROR', payload: null });
  };

  // Handle going offline
  const handleOffline = () => {
    dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
  };

  // Load pending operations from storage
  const loadPendingOperations = async () => {
    try {
      const operations = await offlineStorage.getPendingOperations();
      dispatch({ type: 'SET_PENDING_OPERATIONS', payload: operations });
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  };

  // Add operation to offline queue
  const addOfflineOperation = async (operation) => {
    try {
      const operationWithId = {
        ...operation,
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        retryCount: 0
      };

      await offlineStorage.addPendingOperation(operationWithId);
      dispatch({ type: 'ADD_PENDING_OPERATION', payload: operationWithId });
      
      updateStorageUsage();
      
      // Try to sync immediately if online
      if (state.isOnline && state.autoSyncEnabled) {
        syncPendingOperations();
      }
      
      return operationWithId.id;
    } catch (error) {
      console.error('Error adding offline operation:', error);
      throw error;
    }
  };

  // Sync pending operations
  const syncPendingOperations = async () => {
    if (state.syncInProgress || !state.isOnline) return;

    dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: true });
    dispatch({ type: 'SET_SYNC_ERROR', payload: null });

    try {
      const operations = [...state.pendingOperations];
      const results = await syncService.syncOperations(operations);

      // Process sync results
      for (const result of results) {
        if (result.success) {
          await offlineStorage.removePendingOperation(result.operationId);
          dispatch({ type: 'REMOVE_PENDING_OPERATION', payload: result.operationId });
        } else {
          // Update retry count
          const operation = operations.find(op => op.id === result.operationId);
          if (operation) {
            operation.retryCount = (operation.retryCount || 0) + 1;
            operation.lastError = result.error;
            
            // Remove if too many retries
            if (operation.retryCount >= 3) {
              await offlineStorage.removePendingOperation(result.operationId);
              dispatch({ type: 'REMOVE_PENDING_OPERATION', payload: result.operationId });
            } else {
              await offlineStorage.updatePendingOperation(operation);
            }
          }
        }
      }

      dispatch({ type: 'SET_LAST_SYNC_TIME', payload: new Date().toISOString() });
      updateStorageUsage();
    } catch (error) {
      console.error('Sync failed:', error);
      dispatch({ type: 'SET_SYNC_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_SYNC_IN_PROGRESS', payload: false });
    }
  };

  // Update storage usage
  const updateStorageUsage = async () => {
    try {
      const usage = await offlineStorage.getStorageUsage();
      dispatch({ type: 'SET_STORAGE_USAGE', payload: usage });
    } catch (error) {
      console.error('Error getting storage usage:', error);
    }
  };

  // Clear offline data
  const clearOfflineData = async () => {
    try {
      await offlineStorage.clearAll();
      dispatch({ type: 'SET_PENDING_OPERATIONS', payload: [] });
      updateStorageUsage();
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  };

  // Toggle auto-sync
  const toggleAutoSync = (enabled) => {
    dispatch({ type: 'SET_AUTO_SYNC', payload: enabled });
    
    if (enabled) {
      syncService.startPeriodicSync(state.syncInterval, syncPendingOperations);
    } else {
      syncService.stopPeriodicSync();
    }
  };

  // Manual sync trigger
  const manualSync = () => {
    if (state.isOnline) {
      syncPendingOperations();
    }
  };

  // Store data offline (for read operations)
  const storeOfflineData = async (key, data) => {
    try {
      await offlineStorage.setItem(key, data);
      updateStorageUsage();
    } catch (error) {
      console.error('Error storing offline data:', error);
      throw error;
    }
  };

  // Get offline data
  const getOfflineData = async (key) => {
    try {
      return await offlineStorage.getItem(key);
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  };

  const value = {
    ...state,
    addOfflineOperation,
    syncPendingOperations,
    clearOfflineData,
    toggleAutoSync,
    manualSync,
    storeOfflineData,
    getOfflineData,
    updateStorageUsage
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
