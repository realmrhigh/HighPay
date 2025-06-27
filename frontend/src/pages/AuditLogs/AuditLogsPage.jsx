import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Pagination,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore,
  FilterList,
  Download,
  Visibility,
  Search,
  Security,
  Person,
  Edit,
  Delete,
  Payment,
  Schedule,
  LocationOn
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext.simple';
import { format, parseISO, subDays, startOfDay, endOfDay } from 'date-fns';

const ACTION_TYPES = {
  'USER_LOGIN': { icon: <Person />, color: 'info', label: 'User Login' },
  'USER_LOGOUT': { icon: <Person />, color: 'default', label: 'User Logout' },
  'TIME_PUNCH': { icon: <Schedule />, color: 'primary', label: 'Time Punch' },
  'CORRECTION_REQUEST': { icon: <Edit />, color: 'warning', label: 'Correction Request' },
  'CORRECTION_APPROVED': { icon: <Edit />, color: 'success', label: 'Correction Approved' },
  'CORRECTION_DENIED': { icon: <Edit />, color: 'error', label: 'Correction Denied' },
  'PAYROLL_RUN': { icon: <Payment />, color: 'success', label: 'Payroll Run' },
  'USER_CREATED': { icon: <Person />, color: 'success', label: 'User Created' },
  'USER_UPDATED': { icon: <Person />, color: 'info', label: 'User Updated' },
  'USER_DELETED': { icon: <Person />, color: 'error', label: 'User Deleted' },
  'LOCATION_CREATED': { icon: <LocationOn />, color: 'success', label: 'Location Created' },
  'LOCATION_UPDATED': { icon: <LocationOn />, color: 'info', label: 'Location Updated' },
  'LOCATION_DELETED': { icon: <LocationOn />, color: 'error', label: 'Location Deleted' },
  'SCHEDULE_CREATED': { icon: <Schedule />, color: 'success', label: 'Schedule Created' },
  'SCHEDULE_UPDATED': { icon: <Schedule />, color: 'info', label: 'Schedule Updated' },
  'SCHEDULE_DELETED': { icon: <Schedule />, color: 'error', label: 'Schedule Deleted' },
  'SECURITY_ALERT': { icon: <Security />, color: 'error', label: 'Security Alert' }
};

export function AuditLogsPage() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    actionType: '',
    userId: '',
    search: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadAuditLogs();
  }, [page, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockLogs = [
        {
          id: 1,
          actor_user_id: 1,
          actor_name: 'John Doe',
          action_type: 'TIME_PUNCH',
          target_entity: 'time_punches',
          target_id: 101,
          details: {
            punch_type: 'CLOCK_IN',
            location: { latitude: 40.7128, longitude: -74.0060 },
            device: 'Mobile App'
          },
          timestamp: '2024-01-15T09:00:00Z',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
        },
        {
          id: 2,
          actor_user_id: 3,
          actor_name: 'Manager User',
          action_type: 'CORRECTION_APPROVED',
          target_entity: 'correction_requests',
          target_id: 5,
          details: {
            original_time: '2024-01-14T17:00:00Z',
            corrected_time: '2024-01-14T17:30:00Z',
            employee_id: 2,
            employee_name: 'Jane Smith',
            reason: 'System malfunction'
          },
          timestamp: '2024-01-15T08:30:00Z',
          ip_address: '192.168.1.50',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: 3,
          actor_user_id: 1,
          actor_name: 'Admin User',
          action_type: 'PAYROLL_RUN',
          target_entity: 'payrolls',
          target_id: 20,
          details: {
            pay_period_start: '2024-01-01',
            pay_period_end: '2024-01-14',
            employee_count: 25,
            total_amount: 45000.00,
            status: 'completed'
          },
          timestamp: '2024-01-15T10:00:00Z',
          ip_address: '192.168.1.10',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: 4,
          actor_user_id: 1,
          actor_name: 'Admin User',
          action_type: 'LOCATION_CREATED',
          target_entity: 'locations',
          target_id: 3,
          details: {
            name: 'Downtown Office',
            address: '123 Main St, City, State',
            geofence_radius: 100,
            wifi_networks: ['OfficeWiFi-Main', 'OfficeWiFi-Guest']
          },
          timestamp: '2024-01-14T14:30:00Z',
          ip_address: '192.168.1.10',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          id: 5,
          actor_user_id: 2,
          actor_name: 'Jane Smith',
          action_type: 'SECURITY_ALERT',
          target_entity: 'users',
          target_id: 2,
          details: {
            alert_type: 'SUSPICIOUS_LOGIN',
            reason: 'Login from unusual location',
            location: 'Unknown City, Country',
            blocked: true
          },
          timestamp: '2024-01-14T22:15:00Z',
          ip_address: '203.0.113.45',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        }
      ];

      setAuditLogs(mockLogs);
      setTotalPages(1); // Mock pagination
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      actionType: '',
      userId: '',
      search: ''
    });
    setPage(1);
  };

  const handleExport = async () => {
    try {
      // Mock export functionality
      const csvContent = [
        'Date,User,Action,Target,IP Address,Details',
        ...auditLogs.map(log => [
          format(parseISO(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
          log.actor_name,
          ACTION_TYPES[log.action_type]?.label || log.action_type,
          `${log.target_entity}:${log.target_id}`,
          log.ip_address,
          JSON.stringify(log.details)
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export audit logs');
    }
  };

  const formatTimestamp = (timestamp) => {
    return format(parseISO(timestamp), 'MMM dd, yyyy HH:mm:ss');
  };

  const getActionInfo = (actionType) => {
    return ACTION_TYPES[actionType] || {
      icon: <Security />,
      color: 'default',
      label: actionType
    };
  };

  const renderDetailsPreview = (details) => {
    const keys = Object.keys(details);
    if (keys.length === 0) return 'No details';
    
    const preview = keys.slice(0, 2).map(key => {
      const value = details[key];
      if (typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    }).join(', ');
    
    return keys.length > 2 ? `${preview}...` : preview;
  };

  if (loading) {
    return <Box p={3}>Loading audit logs...</Box>;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Audit Logs</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Accordion expanded={showFilters} sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Filter Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={filters.actionType}
                  onChange={(e) => handleFilterChange('actionType', e.target.value)}
                  label="Action Type"
                >
                  <MenuItem value="">All Actions</MenuItem>
                  {Object.entries(ACTION_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search users, actions..."
                fullWidth
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button onClick={handleClearFilters} variant="outlined" size="small">
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Audit Logs Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>IP Address</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs.map((log) => {
              const actionInfo = getActionInfo(log.action_type);
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTimestamp(log.timestamp)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {log.actor_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{log.actor_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {log.actor_user_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={actionInfo.icon}
                      label={actionInfo.label}
                      color={actionInfo.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.target_entity}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {log.target_id}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {log.ip_address}
                    </Typography>
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
                      {renderDetailsPreview(log.details)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedLog(log);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {auditLogs.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No audit logs found for the selected criteria.
        </Alert>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Basic Information
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box>
                        <Typography variant="subtitle2">Timestamp</Typography>
                        <Typography variant="body2">{formatTimestamp(selectedLog.timestamp)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">User</Typography>
                        <Typography variant="body2">{selectedLog.actor_name} (ID: {selectedLog.actor_user_id})</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Action</Typography>
                        <Chip
                          icon={getActionInfo(selectedLog.action_type).icon}
                          label={getActionInfo(selectedLog.action_type).label}
                          color={getActionInfo(selectedLog.action_type).color}
                          size="small"
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">Target</Typography>
                        <Typography variant="body2">
                          {selectedLog.target_entity} (ID: {selectedLog.target_id})
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Technical Details
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box>
                        <Typography variant="subtitle2">IP Address</Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {selectedLog.ip_address}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2">User Agent</Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {selectedLog.user_agent}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Action Details
                    </Typography>
                    <Box 
                      component="pre" 
                      sx={{ 
                        bgcolor: 'grey.100', 
                        p: 2, 
                        borderRadius: 1, 
                        overflow: 'auto',
                        fontSize: '0.875rem'
                      }}
                    >
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
