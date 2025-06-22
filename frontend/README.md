# HighPay React Dashboard

A modern, responsive React dashboard for the HighPay payroll management system.

## 🚀 Features

- **Modern UI**: Built with Material-UI (MUI) for a professional look
- **Real-time Updates**: WebSocket integration for live notifications
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Role-based Access**: Different views for Admin, Manager, and Employee roles
- **Interactive Charts**: Visual analytics with Chart.js integration
- **Time Tracking**: Built-in clock in/out functionality with GPS support
- **Authentication**: Secure JWT-based authentication
- **Notifications**: Real-time toast notifications and notification panel

## 🛠️ Technology Stack

- **React 18** - Modern React with hooks
- **Material-UI (MUI)** - Professional UI components
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Chart.js + React-ChartJS-2** - Interactive charts
- **Socket.IO Client** - Real-time communication
- **React Hook Form + Yup** - Form handling and validation
- **Axios** - HTTP client
- **Date-fns** - Date manipulation
- **React Hot Toast** - Beautiful notifications

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- HighPay Backend API running on port 3000

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
│   └── UI/              # Common UI components
├── contexts/            # React contexts for state management
│   ├── AuthContext.jsx  # Authentication state
│   └── WebSocketContext.jsx # Real-time communication
├── pages/               # Page components
│   ├── Auth/           # Login and authentication
│   ├── Dashboard/      # Main dashboard
│   ├── Employees/      # Employee management
│   ├── TimeTracking/   # Time tracking features
│   ├── Payroll/        # Payroll management
│   ├── PayStubs/       # Pay stub viewing
│   ├── JobRoles/       # Job role management
│   ├── Analytics/      # Reports and analytics
│   ├── Settings/       # System settings
│   └── Profile/        # User profile
├── services/           # API services
│   └── api.js          # HTTP client and API calls
├── App.jsx             # Main app component
├── main.jsx            # React entry point
└── index.css           # Global styles
```

## 🎨 UI Features

### Dashboard
- **Real-time Status**: Live employee status and activity
- **Quick Actions**: Clock in/out directly from dashboard
- **Analytics Cards**: Key metrics at a glance
- **Interactive Charts**: Visual data representation
- **Recent Activity**: Live feed of system events

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

- **JWT Tokens**: Secure token-based authentication
- **Automatic Logout**: Handles expired tokens gracefully
- **Role-based Access**: Different features for different user roles
- **Secure Storage**: Tokens stored securely in localStorage
- **Route Protection**: Unauthorized access prevention

## 📱 Responsive Design

- **Mobile First**: Designed with mobile users in mind
- **Tablet Support**: Optimized for tablet devices
- **Desktop Enhanced**: Full-featured desktop experience
- **Touch Friendly**: Large touch targets and gestures
- **Accessibility**: WCAG compliant design patterns

## 🚀 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Development Features

- **Hot Reload**: Instant updates during development
- **React DevTools**: Enhanced debugging with React Query devtools
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Vite**: Lightning-fast build and reload times

## 🌐 API Integration

The dashboard integrates with the HighPay backend API:

- **Authentication**: Login, logout, token refresh
- **Users**: Employee management and profiles
- **Time Tracking**: Clock in/out, break tracking
- **Payroll**: Payroll runs and processing
- **Analytics**: Real-time and historical data
- **WebSocket**: Live updates and notifications

## 🎯 User Roles

### Employee
- View personal dashboard
- Clock in/out and break tracking
- View personal pay stubs
- Update profile information
- Receive notifications

### Manager
- All employee features
- View team analytics
- Manage team members
- Generate reports
- Monitor real-time activity

### Admin
- All manager features
- System-wide analytics
- Payroll management
- User management
- System configuration

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
