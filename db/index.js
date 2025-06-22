const { Pool } = require('pg');

// Configuration for the database connection
// It's recommended to use environment variables for sensitive data
const pool = new Pool({
  user: process.env.DB_USER || 'postgres', // Default user for local development
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'highpay_dev', // Default database name
  password: process.env.DB_PASSWORD || 'password', // Default password for local development
  port: process.env.DB_PORT || 5432,
});

// Test the connection (optional, but good for initial setup)
pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1); // Exit the process if the pool encounters a critical error
});

// Export a query function that uses a client from the pool
module.exports = {
  query: (text, params) => pool.query(text, params),
  // You can also export the pool itself if you need direct access to it
  // pool: pool,
  // Example of a function to test connection or run a simple query
  testConnection: async () => {
    try {
      const client = await pool.connect();
      console.log('Successfully acquired client and connected to PostgreSQL!');
      const res = await client.query('SELECT NOW()');
      console.log('Current time from DB:', res.rows[0].now);
      client.release();
      return true;
    } catch (error) {
      console.error('Failed to connect to the database:', error);
      return false;
    }
  }
};
