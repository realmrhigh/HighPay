import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.headers['X-Requested-At'] = new Date().toISOString()
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('highpay_token')
          localStorage.removeItem('highpay_user')
          window.location.href = '/login'
          break
        case 403:
          toast.error('Access denied. You don\'t have permission for this action.')
          break
        case 404:
          toast.error('Resource not found.')
          break
        case 429:
          toast.error('Too many requests. Please try again later.')
          break
        case 500:
          toast.error('Server error. Please try again later.')
          break
        default:
          if (data?.message) {
            toast.error(data.message)
          }
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.')
    } else {
      toast.error('An unexpected error occurred.')
    }
    
    return Promise.reject(error)
  }
)

// API Services
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
}

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  changePassword: (passwordData) => api.put('/users/me/password', passwordData),
}

export const timeTrackingAPI = {
  clockIn: (data) => api.post('/time-punches', { ...data, type: 'clock_in' }),
  clockOut: (data) => api.post('/time-punches', { ...data, type: 'clock_out' }),
  startBreak: (data) => api.post('/time-punches', { ...data, type: 'break_start' }),
  endBreak: (data) => api.post('/time-punches', { ...data, type: 'break_end' }),
  getUserPunches: (userId, params) => api.get(`/time-punches/user/${userId}`, { params }),
  getTodaysPunches: () => api.get('/time-punches/today'),
  getMyPunches: (params) => api.get('/time-punches/me', { params }),
  updatePunch: (id, data) => api.put(`/time-punches/${id}`, data),
  deletePunch: (id) => api.delete(`/time-punches/${id}`),
}

export const payrollAPI = {
  getAll: (params) => api.get('/payrolls', { params }),
  getById: (id) => api.get(`/payrolls/${id}`),
  create: (payrollData) => api.post('/payrolls', payrollData),
  update: (id, payrollData) => api.put(`/payrolls/${id}`, payrollData),
  complete: (id) => api.put(`/payrolls/${id}/complete`),
  delete: (id) => api.delete(`/payrolls/${id}`),
  processPayroll: (id) => api.post(`/payrolls/${id}/process`),
}

export const payStubsAPI = {
  getUserPayStubs: (userId, params) => api.get(`/pay-stubs/user/${userId}`, { params }),
  getMyPayStubs: (params) => api.get('/pay-stubs/me', { params }),
  getById: (id) => api.get(`/pay-stubs/${id}`),
  downloadPDF: (id) => api.get(`/pay-stubs/${id}/pdf`, { responseType: 'blob' }),
  emailPayStub: (id) => api.post(`/pay-stubs/${id}/email`),
}

export const jobRolesAPI = {
  getAll: () => api.get('/job-roles'),
  getById: (id) => api.get(`/job-roles/${id}`),
  create: (roleData) => api.post('/job-roles', roleData),
  update: (id, roleData) => api.put(`/job-roles/${id}`, roleData),
  delete: (id) => api.delete(`/job-roles/${id}`),
}

export const analyticsAPI = {
  getDashboard: (params) => api.get('/v1/analytics/dashboard', { params }),
  getRealtime: () => api.get('/v1/analytics/realtime'),
  getEmployee: (id, params) => api.get(`/v1/analytics/employee/${id}`, { params }),
  getPayroll: (params) => api.get('/v1/analytics/payroll', { params }),
  getAttendance: (params) => api.get('/v1/analytics/attendance', { params }),
  getTimeTracking: (params) => api.get('/v1/analytics/time-tracking', { params }),
  getProductivity: (params) => api.get('/v1/analytics/productivity', { params }),
  createCustomReport: (reportData) => api.post('/v1/analytics/custom-report', reportData),
  exportData: (params) => api.get('/v1/analytics/export', { params, responseType: 'blob' }),
}

export const reportsAPI = {
  getPayStubPDF: (id) => api.get(`/v1/reports/paystub/${id}/pdf`, { responseType: 'blob' }),
  getPayrollPDF: (id) => api.get(`/v1/reports/payroll/${id}/pdf`, { responseType: 'blob' }),
  getTimeTrackingPDF: (userId, params) => api.get(`/v1/reports/timetracking/${userId}/pdf`, { 
    params, 
    responseType: 'blob' 
  }),
  getWebSocketStats: () => api.get('/v1/reports/websocket/stats'),
}

export const companyAPI = {
  getInfo: () => api.get('/company'),
  updateInfo: (companyData) => api.put('/company', companyData),
  getSettings: () => api.get('/company/settings'),
  updateSettings: (settings) => api.put('/company/settings', settings),
}

// Utility functions
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const formatApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Helper function to handle file downloads
export const handleDownload = async (downloadFn, filename, loadingMessage = 'Generating file...') => {
  try {
    toast.loading(loadingMessage)
    const response = await downloadFn()
    downloadFile(response.data, filename)
    toast.dismiss()
    toast.success('File downloaded successfully')
  } catch (error) {
    toast.dismiss()
    toast.error(formatApiError(error))
    throw error
  }
}

export default api
