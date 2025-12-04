import type { Config } from 'jest';

/**
 * Jest Configuration for TixPeer Backend
 *
 * Supports:
 * - Unit tests (test/unit/)
 * - Integration tests (test/integration/)
 * - WebSocket tests (test/websocket/)
 * - E2E tests (test/e2e/) - use separate config
 */
const config: Config = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',

  // Run tests in Node environment
  testEnvironment: 'node',

  // Root directory for tests
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '<rootDir>/test/unit/**/*.spec.ts',
    '<rootDir>/test/integration/**/*.spec.ts',
    '<rootDir>/test/websocket/**/*.spec.ts',
  ],

  // Module path aliases (match tsconfig paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    // Exclude files that don't need testing
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/main.ts',
    '!src/database/data-source.ts',
    '!src/database/seeds/**',
    '!src/**/*.interface.ts',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Test timeout (10 seconds for integration tests)
  testTimeout: 10000,

  // Max workers for parallel execution
  maxWorkers: '50%',

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles (useful for debugging)
  detectOpenHandles: true,
};

export default config;
