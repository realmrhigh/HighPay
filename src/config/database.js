const { Pool } = require('pg');
const logger = require('../utils/logger');

// Configuration for the database connection
// It's recommended to use environment variables for sensitive data
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'highpay_dev',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close connections after 30 seconds of inactivity
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Connection event handlers
pool.on('connect', () => {
  logger.info('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  pool.end(() => {
    logger.info('Pool has ended');
    process.exit(0);
  });
});

// Export a query function that uses a client from the pool
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
  
  // Function to test connection
  testConnection: async () => {
    try {
      const client = await pool.connect();
      logger.info('Successfully acquired client and connected to PostgreSQL');
      const res = await client.query('SELECT NOW()');
      logger.info('Database connection test successful:', res.rows[0].now);
      client.release();
      return true;
    } catch (error) {
      logger.error('Failed to connect to the database:', error);
      return false;
    }
  },

  // Function to run migrations or setup
  setupDatabase: async () => {
    try {
      const client = await pool.connect();
      
      // Check if tables exist, create if they don't
      const checkTablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('companies', 'users', 'jobroles', 'payrolls', 'paystubs', 'timepunches')
      `;
      
      const result = await client.query(checkTablesQuery);
      client.release();
      
      if (result.rows.length < 6) {
        logger.warn('Some database tables are missing. Please run the schema.sql file');
        return false;
      }
      
      logger.info('Database setup verified - all tables exist');
      return true;
    } catch (error) {
      logger.error('Database setup verification failed:', error);
      return false;
    }
  }
};
