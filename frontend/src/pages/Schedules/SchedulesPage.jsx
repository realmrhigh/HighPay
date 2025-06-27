import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Schedule,
  Person,
  CalendarToday,
  AccessTime
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { format, parse } from 'date-fns';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
];

export function SchedulesPage() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    is_recurring: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      await loadSchedules();
      await loadEmployees();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSchedules = async () => {
    // Mock data - replace with actual API call
    const mockSchedules = [
      {
        id: 1,
        user_id: 1,
        user_name: 'John Doe',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        user_id: 1,
        user_name: 'John Doe',
        day_of_week: 2,
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true,
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        user_id: 2,
        user_name: 'Jane Smith',
        day_of_week: 1,
        start_time: '08:00',
        end_time: '16:00',
        is_recurring: true,
        created_at: new Date().toISOString()
      }
    ];
    setSchedules(mockSchedules);
  };

  const loadEmployees = async () => {
    // Mock data - replace with actual API call
    const mockEmployees = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ];
    setEmployees(mockEmployees);
  };

  const handleOpenDialog = (schedule = null) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        user_id: schedule.user_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_recurring: schedule.is_recurring
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        user_id: '',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSchedule(null);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Mock implementation - replace with actual API call
      const scheduleData = {
        ...formData,
        id: editingSchedule ? editingSchedule.id : Date.now(),
        user_name: employees.find(e => e.id === formData.user_id)?.name || '',
        created_at: new Date().toISOString()
      };

      if (editingSchedule) {
        setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? scheduleData : s));
      } else {
        setSchedules(prev => [...prev, scheduleData]);
      }

      handleCloseDialog();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async () => {
    try {
      setSchedules(prev => prev.filter(s => s.id !== scheduleToDelete.id));
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const calculateTotalHours = (startTime, endTime) => {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    const diffMs = end - start;
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };

  const getEmployeeSchedules = (employeeId) => {
    return schedules.filter(s => s.user_id === employeeId);
  };

  const getWeeklyScheduleView = () => {
    const scheduleGrid = {};
    
    // Initialize grid
    employees.forEach(emp => {
      scheduleGrid[emp.id] = {
        employee: emp,
        days: {}
      };
      DAYS_OF_WEEK.forEach(day => {
        scheduleGrid[emp.id].days[day.value] = null;
      });
    });

    // Fill grid with schedules
    schedules.forEach(schedule => {
      if (scheduleGrid[schedule.user_id]) {
        scheduleGrid[schedule.user_id].days[schedule.day_of_week] = schedule;
      }
    });

    return Object.values(scheduleGrid);
  };

  const getDayLabel = (dayValue) => {
    return DAYS_OF_WEEK.find(d => d.value === dayValue)?.label || 'Unknown';
  };

  const getShortDayLabel = (dayValue) => {
    return DAYS_OF_WEEK.find(d => d.value === dayValue)?.short || 'Unknown';
  };

  if (loading) {
    return <Box p={3}>Loading schedules...</Box>;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Employee Schedules</Typography>
        {(user.permission_role === 'admin' || user.permission_role === 'manager') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Schedule
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
          <Tab label="Weekly View" />
          <Tab label="List View" />
          <Tab label="Employee Summary" />
        </Tabs>
      </Box>

      {/* Weekly View */}
      {currentTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                {DAYS_OF_WEEK.map(day => (
                  <TableCell key={day.value} align="center">
                    {day.short}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {getWeeklyScheduleView().map(row => (
                <TableRow key={row.employee.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {row.employee.name.charAt(0)}
                      </Avatar>
                      {row.employee.name}
                    </Box>
                  </TableCell>
                  {DAYS_OF_WEEK.map(day => (
                    <TableCell key={day.value} align="center">
                      {row.days[day.value] ? (
                        <Box>
                          <Typography variant="body2">
                            {row.days[day.value].start_time} - {row.days[day.value].end_time}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {calculateTotalHours(
                              row.days[day.value].start_time,
                              row.days[day.value].end_time
                            ).toFixed(1)}h
                          </Typography>
                          {(user.permission_role === 'admin' || user.permission_role === 'manager') && (
                            <Box mt={0.5}>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(row.days[day.value])}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setScheduleToDelete(row.days[day.value]);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Off
                        </Typography>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* List View */}
      {currentTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Day</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell>Recurring</TableCell>
                {(user.permission_role === 'admin' || user.permission_role === 'manager') && (
                  <TableCell>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.map(schedule => (
                <TableRow key={schedule.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {schedule.user_name.charAt(0)}
                      </Avatar>
                      {schedule.user_name}
                    </Box>
                  </TableCell>
                  <TableCell>{getDayLabel(schedule.day_of_week)}</TableCell>
                  <TableCell>{schedule.start_time}</TableCell>
                  <TableCell>{schedule.end_time}</TableCell>
                  <TableCell>
                    {calculateTotalHours(schedule.start_time, schedule.end_time).toFixed(1)}h
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.is_recurring ? 'Yes' : 'No'}
                      color={schedule.is_recurring ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  {(user.permission_role === 'admin' || user.permission_role === 'manager') && (
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(schedule)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setScheduleToDelete(schedule);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Employee Summary */}
      {currentTab === 2 && (
        <Grid container spacing={3}>
          {employees.map(employee => {
            const empSchedules = getEmployeeSchedules(employee.id);
            const totalWeeklyHours = empSchedules.reduce((sum, schedule) => {
              return sum + calculateTotalHours(schedule.start_time, schedule.end_time);
            }, 0);

            return (
              <Grid item xs={12} md={6} lg={4} key={employee.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar>{employee.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="h6">{employee.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Weekly Hours: {totalWeeklyHours.toFixed(1)}h
                      </Typography>
                      <Typography variant="subtitle2" gutterBottom>
                        Scheduled Days: {empSchedules.length}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Schedule:
                      </Typography>
                      {empSchedules.length > 0 ? (
                        empSchedules.map(schedule => (
                          <Typography key={schedule.id} variant="body2" color="text.secondary">
                            {getShortDayLabel(schedule.day_of_week)}: {schedule.start_time} - {schedule.end_time}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No schedule assigned
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {schedules.length === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No schedules have been created yet.
          {(user.permission_role === 'admin' || user.permission_role === 'manager') && 
            ' Click "Add Schedule" to create your first schedule.'}
        </Alert>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={formData.user_id}
                onChange={(e) => handleFormChange('user_id', e.target.value)}
                label="Employee"
              >
                {employees.map(employee => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={formData.day_of_week}
                onChange={(e) => handleFormChange('day_of_week', e.target.value)}
                label="Day of Week"
              >
                {DAYS_OF_WEEK.map(day => (
                  <MenuItem key={day.value} value={day.value}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box display="flex" gap={2}>
              <TextField
                label="Start Time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleFormChange('start_time', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleFormChange('end_time', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_recurring}
                  onChange={(e) => handleFormChange('is_recurring', e.target.checked)}
                />
              }
              label="Recurring Weekly"
            />

            {formData.start_time && formData.end_time && (
              <Alert severity="info">
                Total hours: {calculateTotalHours(formData.start_time, formData.end_time).toFixed(1)}h
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSchedule ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Schedule</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this schedule for{' '}
            {scheduleToDelete?.user_name} on {getDayLabel(scheduleToDelete?.day_of_week)}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
