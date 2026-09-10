/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Ceylon Expand - Vitest Testing Configuration
 * Comprehensive testing setup for TypeScript + React application
 */
export default defineConfig({
  plugins: [react()],
  
  test: {
    // Test environment
    environment: 'jsdom',
    environmentMatchGlobs: [
      ['server/**', 'node'],
    ],
    
    // Global test setup
    globals: true,
    setupFiles: ['./client/src/test/setup.ts'],
    
    // File patterns
    include: [
      'client/src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'server/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      'shared/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.cache/',
      'uploads/',
      'migrations/',
    ],
    
    // Coverage configuration
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts', // Re-export files
        'dist/',
        'build/',
        'coverage/',
        'uploads/',
        'migrations/',
        'server/public/',
        'client/src/main.tsx', // Entry point
      ],
      // Coverage thresholds for quality gates
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
    },
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporters
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './coverage/test-results.json',
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Performance
    isolate: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
  
  // Path resolution for tests
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
      '@server': resolve(__dirname, './server'),
    },
  },
  
  // Define configuration for different environments
  define: {
    'import.meta.env.VITE_TEST_ENV': '"test"',
  },
});