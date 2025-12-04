/**
 * Jest Global Setup
 *
 * This file runs before all tests to:
 * - Configure test environment
 * - Set up global mocks
 * - Initialize test database connection
 */

import { DataSource } from 'typeorm';

// Increase timeout for async operations
jest.setTimeout(10000);

// Global test database connection (set by test-database.ts)
declare global {
  // eslint-disable-next-line no-var
  var testDataSource: DataSource | undefined;
}

// Mock console methods to reduce noise in test output
// Comment out if you need to debug tests
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Clean up after all tests
afterAll(async () => {
  // Close database connection if open
  if (global.testDataSource?.isInitialized) {
    await global.testDataSource.destroy();
  }
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
