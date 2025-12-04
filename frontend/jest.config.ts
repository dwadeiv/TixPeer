/**
 * Jest Configuration for Frontend
 *
 * Configures Jest for testing React components and contexts with:
 * - TypeScript support via ts-jest
 * - jsdom environment for DOM testing
 * - Module path aliases matching Next.js configuration
 * - React Testing Library integration
 */

import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

const config: Config = {
  // Use jsdom environment for browser-like testing
  testEnvironment: 'jsdom',

  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Module path aliases matching tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/src/**/*.spec.{ts,tsx}',
    '<rootDir>/__tests__/**/*.{ts,tsx}',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/not-found.tsx',
  ],

  // Transform TypeScript files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
export default createJestConfig(config);
