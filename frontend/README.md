# HighPay React Dashboard

A modern, responsive React dashboard for the HighPay payroll management system with advanced location-based time tracking and offline capabilities.

## 🚀 Features

- **Modern UI**: Built with Material-UI (MUI) for a professional look
- **Real-time Updates**: WebSocket integration for live notifications
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Role-based Access**: Different views for Admin, Manager, and Employee roles
- **Interactive Charts**: Visual analytics with Chart.js integration
- **Location-based Time Tracking**: GPS and WiFi validation for clock in/out
- **Offline Mode**: Local storage with background sync for poor connectivity
- **Multi-location Support**: Geofencing and location management
- **Schedule Management**: Recurring weekly schedules for employees
- **Correction Requests**: Employee time punch correction workflow
- **Audit Logging**: Complete audit trail for compliance
- **Authentication**: Secure JWT-based authentication with strong password policy
- **Progressive Web App**: PWA capabilities for mobile installation

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Professional UI components
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **React Query** - Server state management with offline support
- **Chart.js + React-ChartJS-2** - Interactive charts
- **Socket.IO Client** - Real-time communication
- **React Hook Form + Yup** - Form handling and validation
- **Axios** - HTTP client with request interceptors
- **Date-fns** - Date manipulation
- **React Hot Toast** - Beautiful notifications
- **LocalForage** - Offline storage for data persistence
- **React-PWA** - Progressive Web App capabilities

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- HighPay Backend API running on port 3000
- HTTPS for production (required for geolocation)

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Dashboard**
   Navigate to `http://localhost:3001`

4. **Login**
   Use the demo credentials provided on the login page:
   - **Admin**: admin@company.com / admin123
   - **Manager**: manager@company.com / manager123
   - **Employee**: employee@company.com / employee123

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Layout/          # Navigation and layout components
│   ├── UI/              # Common UI components
│   ├── LocationValidation/ # GPS and WiFi validation
│   └── OfflineIndicator/   # Network status components
├── contexts/            # React contexts for state management
│   ├── AuthContext.jsx  # Authentication state
│   ├── WebSocketContext.jsx # Real-time communication
│   ├── LocationContext.jsx  # Location services
│   └── OfflineContext.jsx   # Offline state management
├── pages/               # Page components
│   ├── Auth/           # Login and authentication
│   ├── Dashboard/      # Main dashboard
│   ├── Employees/      # Employee management
│   ├── TimeTracking/   # Location-based time tracking
│   ├── Payroll/        # Payroll management
│   ├── PayStubs/       # Pay stub viewing
│   ├── JobRoles/       # Job role management
│   ├── Locations/      # Multi-location management (NEW)
│   ├── Schedules/      # Schedule management (NEW)
│   ├── Corrections/    # Time punch corrections (NEW)
│   ├── Analytics/      # Reports and analytics
│   ├── AuditLogs/      # Compliance audit logs (NEW)
│   ├── Settings/       # System settings
│   └── Profile/        # User profile
├── services/           # API services
│   ├── api.js          # HTTP client and API calls
│   ├── offlineStorage.js # Local storage management
│   ├── locationService.js # GPS and geofencing
│   └── syncService.js     # Background sync
├── utils/              # Utility functions
│   ├── validation.js   # Form validation rules
│   ├── passwordPolicy.js # Strong password enforcement
│   └── geolocation.js    # GPS utilities
├── App.jsx             # Main app component
├── main.jsx            # React entry point
└── index.css           # Global styles
```

## 🎨 UI Features

### Dashboard
- **Real-time Status**: Live employee status and location
- **Location-aware Actions**: Clock in/out based on location validation
- **Offline Indicator**: Clear network status and sync progress
- **Analytics Cards**: Key metrics with location breakdowns
- **Interactive Charts**: Visual data with location filtering
- **Recent Activity**: Live feed with location context

### Location-based Time Tracking
- **GPS Validation**: Automatic location verification for time punches
- **WiFi Detection**: Alternative validation using approved WiFi networks
- **Geofencing**: Visual map showing allowed work areas
- **Location History**: Track employee movement patterns
- **Manual Corrections**: Employee-initiated time punch corrections

### Multi-location Management
- **Location Setup**: Create and configure work locations
- **Geofence Configuration**: Set GPS boundaries and WiFi networks
- **Employee Assignment**: Assign employees to primary locations
- **Location Analytics**: Per-location performance metrics

### Navigation
- **Responsive Sidebar**: Collapsible navigation with role-based menu items
- **Smart Header**: User info, notifications, and connection status
- **Breadcrumbs**: Clear navigation context
- **Mobile Support**: Touch-friendly mobile navigation

### Real-time Features
- **Live Notifications**: Instant updates for time punches, payroll, etc.
- **Connection Status**: Visual indicator of real-time connection
- **Auto-refresh**: Data automatically updates without page refresh
- **WebSocket Integration**: Efficient real-time communication

## 🔒 Authentication & Security

### Enhanced Security
- **Strong Password Policy**: Enforced password complexity requirements
- **Location Verification**: GPS and WiFi validation for time tracking
- **Audit Logging**: Complete audit trail for all sensitive operations
- **Rate Limiting**: Client-side request throttling
- **Secure Token Storage**: Encrypted local storage

### Compliance Features
- **Data Retention**: Automatic compliance with 3-7 year retention requirements
- **Audit Reports**: Downloadable compliance reports
- **Time Correction Workflow**: Manager approval for time modifications
- **Location Proof**: GPS coordinates stored with all time punches

## 📱 Responsive Design

- **Mobile First**: Designed with mobile users in mind
- **Tablet Support**: Optimized for tablet devices
- **Desktop Enhanced**: Full-featured desktop experience
- **Touch Friendly**: Large touch targets and gestures
- **Accessibility**: WCAG compliant design patterns

## 📱 Progressive Web App

### PWA Features
- **Mobile Installation**: Install as native app on mobile devices
- **Offline Functionality**: Work without internet connection
- **Background Sync**: Automatic data sync when connectivity returns
- **Push Notifications**: Native mobile notifications
- **App Shell**: Fast loading with cached resources

### Offline Capabilities
- **Local Storage**: Time punches stored locally when offline
- **Sync Queue**: Automatic background synchronization
- **Conflict Resolution**: Smart handling of sync conflicts
- **Status Indicators**: Clear offline/online status display

## 🌍 Location Services

### GPS Integration
- **High Accuracy**: Use device GPS for precise location tracking
- **Geofencing**: Automatic validation against work location boundaries
- **Location History**: Track and visualize employee locations
- **Privacy Controls**: Location data only used for work purposes

### WiFi Validation
- **Network Detection**: Validate against approved WiFi networks
- **Fallback Option**: Alternative when GPS is unavailable
- **Security**: Encrypted WiFi SSID storage
- **Multi-network Support**: Multiple approved networks per location

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server with PWA features
- `npm run build` - Build for production with PWA optimization
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with security rules
- `npm run test` - Run unit tests including offline scenarios

### Development Features

- **Location Simulation**: Mock GPS for development testing
- **Offline Testing**: Network throttling for offline scenarios
- **PWA DevTools**: Service worker debugging
- **Security Linting**: Enhanced security rule enforcement

## 🌐 API Integration

### Enhanced API Features
- **Location Services**: GPS validation and geofencing APIs
- **Offline Sync**: Batch sync for offline-collected data
- **Correction Workflow**: Time punch correction approval process
- **Audit Logging**: Comprehensive activity tracking
- **Schedule Management**: Recurring schedule CRUD operations

The dashboard integrates with the HighPay backend API:

- **Authentication**: Login, logout, token refresh
- **Users**: Employee management and profiles
- **Time Tracking**: Clock in/out, break tracking
- **Payroll**: Payroll runs and processing
- **Analytics**: Real-time and historical data
- **WebSocket**: Live updates and notifications

## 🎯 User Roles & Permissions

### Employee (Enhanced)
- Location-based clock in/out with GPS validation
- Offline time tracking with automatic sync
- Submit time correction requests
- View location history and schedule
- Receive location-based notifications

### Manager (Enhanced)
- Approve/deny employee correction requests
- View location-based team analytics
- Manage employee schedules
- Monitor real-time location status
- Access location-specific audit logs

### Admin (Enhanced)
- Multi-location setup and management
- Geofence configuration and WiFi management
- System-wide location analytics
- Comprehensive audit log access
- Global schedule and location oversight

## 🎨 Customization

### Theming
The dashboard uses Material-UI theming for consistent styling:
- Primary color: Blue (#1976d2)
- Secondary color: Purple (#9c27b0)
- Custom typography with Inter font
- Responsive breakpoints
- Dark/light mode ready

### Charts
Chart.js integration provides:
- Line charts for trends
- Doughnut charts for distributions
- Bar charts for comparisons
- Real-time data updates
- Responsive design

## 🔄 Real-time Updates

WebSocket integration provides:
- **Time Punch Notifications**: Instant updates when employees clock in/out
- **Payroll Alerts**: Notifications for payroll events
- **System Messages**: Important system announcements
- **Connection Status**: Live connection monitoring
- **Auto-reconnection**: Handles connection drops gracefully

## 📊 Analytics Dashboard

Future analytics features will include:
- Employee productivity metrics
- Attendance patterns
- Cost analysis
- Custom report generation
- Data export capabilities

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy Options

- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: AWS CloudFront, Cloudflare
- **Docker**: Container deployment
- **Traditional Hosting**: Any web server

### Environment Variables

Create a `.env` file for configuration:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
VITE_GEOLOCATION_TIMEOUT=10000
VITE_SYNC_INTERVAL=30000
VITE_OFFLINE_STORAGE_KEY=highpay_offline
```

## 🛟 Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Ensure backend is running on port 3000
   - Check CORS configuration
   - Verify API endpoints

2. **WebSocket Connection Issues**
   - Check WebSocket URL configuration
   - Verify JWT token validity
   - Check browser WebSocket support

3. **Authentication Problems**
   - Clear localStorage and retry
   - Check token expiration
   - Verify user credentials

### Location Issues
1. **GPS Not Working**: Check browser permissions and HTTPS requirement
2. **Geofencing Errors**: Verify location coordinates and radius settings
3. **WiFi Detection**: Ensure proper network permissions

### Offline Issues
1. **Sync Failures**: Check network connectivity and server status
2. **Storage Full**: Clear old offline data or increase storage limit
3. **Conflicts**: Review sync conflict resolution logs

### Security Issues
1. **Password Policy**: Ensure compliance with strength requirements
2. **Location Privacy**: Verify proper consent and data handling
3. **Audit Gaps**: Check logging configuration for all sensitive operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Material-UI for the excellent component library
- Chart.js for beautiful charts
- React Query for efficient data management
- Socket.IO for real-time communication
