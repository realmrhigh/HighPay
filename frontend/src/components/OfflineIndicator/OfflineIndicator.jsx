import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Typography,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  WifiOff,
  Wifi,
  Sync,
  SyncProblem,
  CloudQueue,
  CloudDone,
  Storage,
  Refresh
} from '@mui/icons-material';
import { useOffline } from '../../contexts/OfflineContext';

export function OfflineIndicator() {
  const {
    isOnline,
    syncInProgress,
    pendingOperations,
    lastSyncTime,
    syncError,
    storageUsage,
    maxStorage,
    manualSync
  } = useOffline();

  const [showDetails, setShowDetails] = React.useState(false);

  const formatStorageUsage = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = () => {
    if (!isOnline) return 'error';
    if (syncError) return 'warning';
    if (pendingOperations.length > 0) return 'info';
    return 'success';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff />;
    if (syncInProgress) return <Sync className="spinning" />;
    if (syncError) return <SyncProblem />;
    if (pendingOperations.length > 0) return <CloudQueue />;
    return <CloudDone />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncInProgress) return 'Syncing...';
    if (syncError) return 'Sync Error';
    if (pendingOperations.length > 0) return `${pendingOperations.length} pending`;
    return 'Online';
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip
          title={
            <Box>
              <Typography variant="body2" fontWeight="bold">
                Connection Status
              </Typography>
              <Typography variant="caption" display="block">
                Status: {getStatusText()}
              </Typography>
              <Typography variant="caption" display="block">
                Last sync: {formatLastSync(lastSyncTime)}
              </Typography>
              {pendingOperations.length > 0 && (
                <Typography variant="caption" display="block">
                  Pending operations: {pendingOperations.length}
                </Typography>
              )}
              <Typography variant="caption" display="block">
                Storage: {formatStorageUsage(storageUsage)} / {formatStorageUsage(maxStorage)}
              </Typography>
            </Box>
          }
          onClick={() => setShowDetails(true)}
          arrow
        >
          <Badge
            badgeContent={pendingOperations.length > 0 ? pendingOperations.length : null}
            color="secondary"
            max={99}
          >
            <Chip
              icon={getStatusIcon()}
              label={getStatusText()}
              color={getStatusColor()}
              size="small"
              variant={isOnline ? 'filled' : 'outlined'}
              clickable
              onClick={() => setShowDetails(true)}
            />
          </Badge>
        </Tooltip>

        {isOnline && !syncInProgress && (
          <Tooltip title="Manual sync">
            <IconButton
              size="small"
              onClick={manualSync}
              disabled={syncInProgress}
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Sync Progress */}
      {syncInProgress && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <LinearProgress color="primary" />
        </Box>
      )}

      {/* Error Snackbar */}
      <Snackbar
        open={!!syncError}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => {}}>
          Sync failed: {syncError}
        </Alert>
      </Snackbar>

      {/* Offline Alert */}
      {!isOnline && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9998,
            bgcolor: 'warning.main',
            color: 'warning.contrastText',
            p: 1,
            textAlign: 'center'
          }}
        >
          <Typography variant="body2">
            <WifiOff sx={{ mr: 1, verticalAlign: 'middle' }} />
            You are currently offline. Data will sync when connection is restored.
          </Typography>
        </Box>
      )}

      {/* Storage Warning */}
      {storageUsage / maxStorage > 0.8 && (
        <Snackbar
          open={true}
          autoHideDuration={10000}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert severity="warning">
            <Storage sx={{ mr: 1 }} />
            Storage almost full: {formatStorageUsage(storageUsage)} / {formatStorageUsage(maxStorage)}
          </Alert>
        </Snackbar>
      )}

      <style jsx>{`
        .spinning {
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
