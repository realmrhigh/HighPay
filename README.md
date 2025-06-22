# HighPay Backend MVP v1.0

A Node.js/Express.js backend API for the HighPay payroll management system.

## Project Overview

HighPay is a minimum viable product (MVP) focused on delivering a pain-free payroll experience for businesses and employees. This backend service provides the core API endpoints and database management for the HighPay platform.

### Core Philosophy
The primary goal of the HighPay MVP is to deliver on our core promise: a simple, fast, and intuitive payroll experience. We relentlessly focus on the essential workflows that cause the most pain for businesses and employees, executing them with flawless simplicity.

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Push Notifications**: Firebase Cloud Messaging (FCM)

## Current Project Structure

```
highpay-backend/
├── index.js                                    # Main application entry point
├── package.json                               # Project dependencies and scripts
├── package-lock.json                         # Dependency lock file
├── .gitignore                                # Git ignore patterns
├── README.md                                 # This file
├── db/                                       # Database configuration and schema
│   ├── index.js                             # Database connection setup
│   └── schema.sql                           # PostgreSQL database schema
├── Authentication API Endpoints & Middleware # Auth routes and middleware
├── Users API (CRUD Endpoints)               # User management endpoints
├── Job Roles API (CRUD Endpoints)           # Job role management endpoints
├── Payroll & Pay Stubs API Endpoints        # Payroll processing endpoints
├── Time Tracking API Endpoints              # Time punch tracking endpoints
├── Push Notification Service (Firebase)     # Push notification implementation
├── Backend Scripts Database & Validation    # Utility scripts and validation
└── HighPay Backend v1.0 (Aligned with Spec) # Backend specification document
```

## Database Schema

The application uses PostgreSQL with the following core tables:

- **Companies**: Company information and settings
- **Users**: Employee and manager accounts with role-based permissions
- **JobRoles**: Job position definitions with pay rates
- **Payrolls**: Payroll run records and status tracking
- **PayStubs**: Individual employee pay stub records
- **TimePunches**: Employee time tracking data (clock in/out, breaks)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - Company and admin user registration
- `POST /api/auth/logout` - User logout

### Users Management
- `GET /api/users` - List company employees (Admin/Manager only)
- `POST /api/users` - Create new employee (Admin only)
- `GET /api/users/:id` - Get employee details
- `PUT /api/users/:id` - Update employee information
- `DELETE /api/users/:id` - Deactivate employee

### Job Roles
- `GET /api/job-roles` - List company job roles
- `POST /api/job-roles` - Create new job role (Admin only)
- `PUT /api/job-roles/:id` - Update job role
- `DELETE /api/job-roles/:id` - Delete job role

### Time Tracking
- `POST /api/time-punches` - Record time punch (clock in/out)
- `GET /api/time-punches/user/:id` - Get user's time punches
- `GET /api/time-punches/today` - Get today's punches for current user

### Payroll
- `GET /api/payrolls` - List payroll runs (Admin/Manager only)
- `POST /api/payrolls` - Create new payroll run (Admin only)
- `GET /api/payrolls/:id` - Get payroll details
- `PUT /api/payrolls/:id/complete` - Mark payroll as completed

### Pay Stubs
- `GET /api/pay-stubs/user/:id` - Get user's pay stubs
- `GET /api/pay-stubs/:id/pdf` - Download pay stub PDF

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd initial-project-setup
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=highpay_dev
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```

4. **Set up the database**
   - Create a PostgreSQL database named `highpay_dev`
   - Run the schema file to create tables:
   ```bash
   psql -U postgres -d highpay_dev -f db/schema.sql
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

The server will start on `http://localhost:3000`

## Development Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with auto-reload (requires nodemon)
- `npm test` - Run tests (not yet implemented)

## Project Organization Recommendations

The current project structure uses descriptive file names but could benefit from a more traditional folder structure. Consider reorganizing as follows:

```
src/
├── controllers/          # Route handlers and business logic
├── middleware/          # Custom middleware functions
├── models/             # Database models and queries  
├── routes/             # Express route definitions
├── utils/              # Utility functions and helpers
├── services/           # External service integrations
└── validators/         # Input validation schemas
```

## Project Organization Analysis

### Current Structure Issues
The current project has some organizational challenges that should be addressed:

1. **File Naming**: API endpoint files are named with spaces and special characters, which can cause issues in some environments
2. **Flat Structure**: All API-related files are in the root directory instead of organized folders
3. **Mixed Content**: Business logic, routes, and middleware are mixed in single files

### Recommended Restructure

To improve maintainability and follow Node.js best practices, consider this structure:

```
src/
├── config/
│   ├── database.js          # Database configuration
│   ├── auth.js              # Authentication configuration
│   └── environment.js       # Environment variables
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management logic
│   ├── jobRoleController.js # Job role management
│   ├── payrollController.js # Payroll processing
│   └── timeController.js    # Time tracking logic
├── middleware/
│   ├── auth.js              # Authentication middleware
│   ├── validation.js        # Input validation
│   ├── errorHandler.js      # Error handling
│   └── rateLimiter.js       # Rate limiting
├── models/
│   ├── User.js              # User data model
│   ├── Company.js           # Company data model
│   ├── JobRole.js           # Job role data model
│   ├── Payroll.js           # Payroll data model
│   └── TimePunch.js         # Time punch data model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── jobRoles.js          # Job role routes
│   ├── payroll.js           # Payroll routes
│   └── time.js              # Time tracking routes
├── services/
│   ├── emailService.js      # Email notifications
│   ├── pdfService.js        # PDF generation
│   ├── pushNotificationService.js # Push notifications
│   └── payrollService.js    # Payroll calculations
├── utils/
│   ├── logger.js            # Logging utility
│   ├── helpers.js           # Common helper functions
│   └── constants.js         # Application constants
├── validators/
│   ├── userValidator.js     # User input validation
│   ├── authValidator.js     # Auth input validation
│   └── payrollValidator.js  # Payroll validation
└── tests/
    ├── unit/                # Unit tests
    ├── integration/         # Integration tests
    └── fixtures/            # Test data
```

### Migration Steps

1. **Create the new folder structure**
2. **Move and rename existing files** to follow naming conventions
3. **Extract business logic** from route files into controllers
4. **Separate database queries** into model files
5. **Update imports** throughout the application
6. **Add comprehensive error handling**
7. **Implement logging** throughout the application

### Additional Recommendations

1. **Add TypeScript** for better type safety and developer experience
2. **Implement comprehensive testing** with Jest or Mocha
3. **Add API documentation** using Swagger/OpenAPI
4. **Set up ESLint and Prettier** for code consistency
5. **Add Docker configuration** for containerized deployment
6. **Implement proper logging** with Winston or similar
7. **Add health check endpoints** for monitoring
8. **Set up CI/CD pipeline** with GitHub Actions or similar

## Next Steps

1. **Immediate Priority**: Restructure the project following the recommended organization
2. **Short Term**: Add proper error handling, logging, and input validation
3. **Medium Term**: Implement comprehensive testing and API documentation
4. **Long Term**: Add advanced features like real-time notifications and AI integration

## 🚀 New Features

### 📚 Interactive API Documentation
- **Swagger/OpenAPI 3.0** integration with beautiful UI
- Comprehensive API documentation with request/response examples
- Interactive testing directly from the docs
- Access at: `http://localhost:3000/api-docs`

### 📄 PDF Generation
- **Professional pay stub PDFs** with company branding
- **Payroll report PDFs** for management
- **Time tracking report PDFs** for detailed analysis
- Automatic PDF generation with proper formatting
- Download endpoints for all report types

### ⚡ Real-time Features (WebSocket)
- **Live time punch notifications** for instant updates
- **Real-time payroll notifications** when pay stubs are ready
- **Management dashboard** with live employee activity
- **Room-based messaging** (general, management, admin)
- **Connection statistics** and monitoring
- WebSocket endpoint: `ws://localhost:3000/ws`

### 🎯 Enhanced API Endpoints

#### New Report Endpoints
- `GET /api/v1/reports/paystub/:id/pdf` - Generate pay stub PDF
- `GET /api/v1/reports/payroll/:id/pdf` - Generate payroll report PDF  
- `GET /api/v1/reports/timetracking/:userId/pdf` - Generate time tracking PDF
- `GET /api/v1/reports/websocket/stats` - WebSocket connection statistics

### 🔧 WebSocket Events
- `connection` - Welcome message on connect
- `time_punch_created` - New time punch notifications
- `time_punch_update` - Real-time time punch updates
- `payroll_update` - Payroll processing notifications
- `new_pay_stub` - New pay stub available notifications
- `system_notification` - System-wide announcements

### 🛠️ Development Tools
- **WebSocket test client** (`websocket-test.html`) for testing real-time features
- Enhanced error handling and logging
- Rate limiting for PDF generation endpoints
- Comprehensive input validation

## 📖 API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

The documentation includes:
- Complete endpoint reference
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Try-it-out functionality

### PDF Generation Examples

#### Generate Pay Stub PDF
```bash
curl -X GET "http://localhost:3000/api/v1/reports/paystub/123/pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output paystub.pdf
```

#### Generate Time Tracking Report
```bash
curl -X GET "http://localhost:3000/api/v1/reports/timetracking/456/pdf?startDate=2025-06-01&endDate=2025-06-30" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output timetracking-report.pdf
```

### WebSocket Connection

#### JavaScript Client
```javascript
// Connect to WebSocket with JWT token
const ws = new WebSocket('ws://localhost:3000/ws?token=YOUR_JWT_TOKEN');

// Handle messages
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

// Send time punch update
ws.send(JSON.stringify({
    type: 'time_punch_update',
    data: {
        type: 'clock_in',
        timestamp: new Date().toISOString()
    }
}));
```

#### Available Message Types
- `ping/pong` - Keep-alive messages
- `join_room` - Join a specific room
- `leave_room` - Leave a specific room
- `time_punch_update` - Send time punch updates

## 🔄 Real-time Notifications

### For Employees
- Instant confirmation when clocking in/out
- Notifications when new pay stubs are available
- System announcements and updates

### For Managers
- Real-time employee time punch monitoring
- Live dashboard updates
- Payroll processing notifications

### For Admins
- Complete system monitoring
- WebSocket connection statistics
- All employee and system notifications

## 📊 Monitoring & Analytics

### WebSocket Statistics
Access real-time connection statistics:
```bash
curl -X GET "http://localhost:3000/api/v1/reports/websocket/stats" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

Response includes:
- Total active connections
- Unique connected users
- Active rooms
- Room-specific user counts

## 🎨 Testing

### WebSocket Testing
1. Open `websocket-test.html` in your browser
2. Enter a valid JWT token
3. Click "Connect" to establish WebSocket connection
4. Test various message types and real-time features

### PDF Testing
1. Create test data (users, time punches, pay stubs)
2. Call PDF generation endpoints
3. Verify PDF formatting and content
4. Test access control for different user roles

## 🚀 Next Steps

The system now includes:
✅ **Interactive API Documentation** with Swagger UI
✅ **Professional PDF Generation** for all reports
✅ **Real-time WebSocket Features** for live updates
✅ **Enhanced Security** and rate limiting
✅ **Comprehensive Testing Tools**

### Recommended Next Features:
- 📈 **Analytics Dashboard** with charts and metrics
- 🔄 **CI/CD Pipeline** with GitHub Actions
- 📧 **Email Templates** for notifications
- 🎯 **Advanced Reporting** with filters and exports
- 🔍 **Audit Logging** for compliance
- 📱 **Mobile App Integration** via API

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions about the HighPay backend system, please contact the development team or create an issue in the project repository.

