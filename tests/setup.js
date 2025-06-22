// Global test setup
const { config } = require('dotenv');

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to keep test output clean
global.console = {
  ...console,
  // Comment out these lines if you want to see console output during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
