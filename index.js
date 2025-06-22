const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // Use environment variable for port or default to 3000

// Middleware to parse JSON bodies
app.use(express.json());

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello from HighPay Backend!');
});

// Placeholder for future routes
// app.use('/api/users', require('./routes/users'));
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/jobroles', require('./routes/jobroles'));
// app.use('/api/payrolls', require('./routes/payrolls'));
// app.use('/api/timetracking', require('./routes/timetracking'));

// Import database connection test
const db = require('./db');

app.listen(port, async () => {
  console.log(`HighPay server listening on port ${port}`);
  // Test database connection on startup
  if (process.env.NODE_ENV !== 'test') { // Avoid DB connection attempts during automated tests if not needed
    await db.testConnection();
  }
});

// Basic error handling (can be expanded)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app; // Export app for potential testing or programmatic use
