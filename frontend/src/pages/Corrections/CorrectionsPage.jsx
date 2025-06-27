import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Add,
  Check,
  Close,
  Visibility,
  AccessTime,
  Person,
  CalendarToday,
  Edit,
  History
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext.simple';
import { useOffline } from '../../contexts/OfflineContext';
import { format, parseISO } from 'date-fns';

const CORRECTION_TYPES = [
  { value: 'CLOCK_IN', label: 'Clock In' },
  { value: 'CLOCK_OUT', label: 'Clock Out' },
  { value: 'BREAK_START', label: 'Break Start' },
  { value: 'BREAK_END', label: 'Break End' }
];

const STATUS_COLORS = {
  pending: 'warning',
  approved: 'success',
  denied: 'error'
};

export function CorrectionsPage() {
  const { user } = useAuth();
  const { addOfflineOperation, isOnline } = useOffline();
  const [currentTab, setCurrentTab] = useState(0);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCorrection, setSelectedCorrection] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    requested_time: '',
    requested_type: 'CLOCK_IN',
    reason: '',
    original_punch_id: null
  });

  useEffect(() => {
    loadCorrections();
  }, []);

  const loadCorrections = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockCorrections = [
        {
          id: 1,
          user_id: 1,
          user_name: 'John Doe',
          requested_by: 1,
          requested_by_name: 'John Doe',
          original_punch_id: 101,
          requested_time: '2024-01-15T09:00:00Z',
          requested_type: 'CLOCK_IN',
          reason: 'Forgot to clock in when I arrived',
          status: 'pending',
          created_at: '2024-01-15T10:30:00Z',
          reviewed_by: null,
          reviewed_at: null
        },
        {
          id: 2,
          user_id: 2,
          user_name: 'Jane Smith',
          requested_by: 2,
          requested_by_name: 'Jane Smith',
          original_punch_id: null,
          requested_time: '2024-01-14T17:00:00Z',
          requested_type: 'CLOCK_OUT',
          reason: 'System glitch prevented clock out',
          status: 'approved',
          created_at: '2024-01-14T18:15:00Z',
          reviewed_by: 3,
          reviewed_by_name: 'Manager Name',
          reviewed_at: '2024-01-15T08:00:00Z'
        },
        {
          id: 3,
          user_id: 3,
          user_name: 'Bob Johnson',
          requested_by: 3,
          requested_by_name: 'Bob Johnson',
          original_punch_id: 102,
          requested_time: '2024-01-13T12:00:00Z',
          requested_type: 'BREAK_START',
          reason: 'Emergency call, forgot to start break',
          status: 'denied',
          created_at: '2024-01-13T13:45:00Z',
          reviewed_by: 3,
          reviewed_by_name: 'Manager Name',
          reviewed_at: '2024-01-14T09:00:00Z'
        }
      ];
      setCorrections(mockCorrections);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      requested_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      requested_type: 'CLOCK_IN',
      reason: '',
      original_punch_id: null
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const correctionData = {
        ...formData,
        requested_time: new Date(formData.requested_time).toISOString(),
        user_id: user.id,
        requested_by: user.id,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (isOnline) {
        // Make API call
        // await api.post('/corrections', correctionData);
        console.log('Submitting correction online:', correctionData);
      } else {
        // Add to offline queue
        await addOfflineOperation({
          type: 'CORRECTION_REQUEST',
          data: correctionData,
          method: 'POST',
          endpoint: '/api/corrections'
        });
      }

      // Update local state (mock)
      const newCorrection = {
        ...correctionData,
        id: Date.now(),
        user_name: user.name,
        requested_by_name: user.name,
        reviewed_by: null,
        reviewed_by_name: null,
        reviewed_at: null
      };
      setCorrections(prev => [newCorrection, ...prev]);

      handleCloseDialog();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleApprove = async (correctionId) => {
    try {
      const correction = corrections.find(c => c.id === correctionId);
      if (!correction) return;

      const updateData = {
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      };

      if (isOnline) {
        // Make API call
        // await api.put(`/corrections/${correctionId}`, updateData);
        console.log('Approving correction online:', correctionId);
      } else {
        await addOfflineOperation({
          type: 'GENERIC_API',
          data: updateData,
          method: 'PUT',
          endpoint: `/api/corrections/${correctionId}`
        });
      }

      // Update local state
      setCorrections(prev => prev.map(c => 
        c.id === correctionId 
          ? { ...c, ...updateData, reviewed_by_name: user.name }
          : c
      ));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeny = async (correctionId) => {
    try {
      const updateData = {
        status: 'denied',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      };

      if (isOnline) {
        // Make API call
        // await api.put(`/corrections/${correctionId}`, updateData);
        console.log('Denying correction online:', correctionId);
      } else {
        await addOfflineOperation({
          type: 'GENERIC_API',
          data: updateData,
          method: 'PUT',
          endpoint: `/api/corrections/${correctionId}`
        });
      }

      // Update local state
      setCorrections(prev => prev.map(c => 
        c.id === correctionId 
          ? { ...c, ...updateData, reviewed_by_name: user.name }
          : c
      ));
    } catch (error) {
      setError(error.message);
    }
  };

  const getFilteredCorrections = () => {
    switch (currentTab) {
      case 0: // All
        return corrections;
      case 1: // Pending
        return corrections.filter(c => c.status === 'pending');
      case 2: // My Requests
        return corrections.filter(c => c.requested_by === user.id);
      default:
        return corrections;
    }
  };

  const getPendingCount = () => {
    return corrections.filter(c => c.status === 'pending').length;
  };

  const formatDateTime = (dateString) => {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getTypeLabel = (type) => {
    return CORRECTION_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return <Box p={3}>Loading corrections...</Box>;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Time Corrections</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Request Correction
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!isOnline && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are offline. Correction requests will be submitted when connection is restored.
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="All Corrections" />
          <Tab 
            label={
              <Badge badgeContent={getPendingCount()} color="secondary">
                Pending Review
              </Badge>
            } 
          />
          <Tab label="My Requests" />
        </Tabs>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Requested Time</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted</TableCell>
              {(user.permission_role === 'admin' || user.permission_role === 'manager') && (
                <TableCell>Actions</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {getFilteredCorrections().map((correction) => (
              <TableRow key={correction.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {correction.user_name.charAt(0)}
                    </Avatar>
                    {correction.user_name}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<AccessTime />}
                    label={getTypeLabel(correction.requested_type)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {formatDateTime(correction.requested_time)}
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxWidth: 200, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {correction.reason}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={correction.status.charAt(0).toUpperCase() + correction.status.slice(1)}
                    color={STATUS_COLORS[correction.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(correction.created_at)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {correction.requested_by_name}
                  </Typography>
                </TableCell>
                {(user.permission_role === 'admin' || user.permission_role === 'manager') && (
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedCorrection(correction);
                            setViewDialogOpen(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {correction.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(correction.id)}
                            >
                              <Check />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deny">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeny(correction.id)}
                            >
                              <Close />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {getFilteredCorrections().length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No correction requests found.
        </Alert>
      )}

      {/* Request Correction Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Request Time Correction</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <Alert severity="info">
              Submit a request to correct your time punch. Your manager will review and approve or deny the request.
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Correction Type</InputLabel>
              <Select
                value={formData.requested_type}
                onChange={(e) => handleFormChange('requested_type', e.target.value)}
                label="Correction Type"
              >
                {CORRECTION_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Correct Time"
              type="datetime-local"
              value={formData.requested_time}
              onChange={(e) => handleFormChange('requested_time', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Reason for Correction"
              value={formData.reason}
              onChange={(e) => handleFormChange('reason', e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Please explain why this correction is needed..."
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.reason.trim()}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Correction Request Details</DialogTitle>
        <DialogContent>
          {selectedCorrection && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Request Information
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box>
                        <Typography variant="subtitle2">Employee</Typography>
                        <Typography variant="body2">{selectedCorrection.user_name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Type</Typography>
                        <Typography variant="body2">{getTypeLabel(selectedCorrection.requested_type)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Requested Time</Typography>
                        <Typography variant="body2">{formatDateTime(selectedCorrection.requested_time)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Reason</Typography>
                        <Typography variant="body2">{selectedCorrection.reason}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Review Information
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box>
                        <Typography variant="subtitle2">Status</Typography>
                        <Chip
                          label={selectedCorrection.status.charAt(0).toUpperCase() + selectedCorrection.status.slice(1)}
                          color={STATUS_COLORS[selectedCorrection.status]}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Submitted</Typography>
                        <Typography variant="body2">{formatDateTime(selectedCorrection.created_at)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          by {selectedCorrection.requested_by_name}
                        </Typography>
                      </Box>
                      {selectedCorrection.reviewed_at && (
                        <>
                          <Box>
                            <Typography variant="subtitle2">Reviewed</Typography>
                            <Typography variant="body2">{formatDateTime(selectedCorrection.reviewed_at)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              by {selectedCorrection.reviewed_by_name}
                            </Typography>
                          </Box>
                        </>
                      )}
                      {selectedCorrection.original_punch_id && (
                        <Box>
                          <Typography variant="subtitle2">Original Punch ID</Typography>
                          <Typography variant="body2">#{selectedCorrection.original_punch_id}</Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
