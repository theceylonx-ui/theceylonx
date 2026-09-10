/**
 * HiBowan - Test Setup Configuration
 * Global test setup for React components and API testing
 */

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables for tests
vi.mock('import.meta.env', () => ({
  VITE_API_URL: 'http://localhost:5000',
  VITE_TEST_ENV: 'test',
  MODE: 'test',
  DEV: false,
  PROD: false,
  SSR: false,
}));

if (typeof window !== 'undefined') {
  // Mock window.matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock ResizeObserver for components that use it
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for lazy loading components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

if (typeof navigator !== 'undefined') {
  // Mock clipboard API for copy functionality
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      readText: vi.fn().mockImplementation(() => Promise.resolve('')),
    },
  });

  // Mock geolocation API for location-based features
  Object.defineProperty(navigator, 'geolocation', {
    value: {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 6.9271, // Colombo, Sri Lanka coordinates
            longitude: 79.8612,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }),
      watchPosition: vi.fn(),
      clearWatch: vi.fn(),
    },
    writable: true,
  });
}

// Mock fetch for API testing
global.fetch = vi.fn();

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockStorage,
    writable: true,
  });
}

// Mock console methods for clean test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: unknown[]) => {
  // Suppress React 18 strict mode warnings in tests
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOMTestUtils.act is deprecated')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

console.warn = (...args: unknown[]) => {
  // Suppress known warnings in test environment
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('componentWillReceiveProps') ||
     args[0].includes('componentWillMount'))
  ) {
    return;
  }
  originalConsoleWarn.call(console, ...args);
};

// Enhanced expect matchers for better test assertions
expect.extend({
  toBeValidDate(received: unknown) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid date`
          : `expected ${received} to be a valid date`,
      pass,
    };
  },
  
  toHaveValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
      pass,
    };
  },
});

// Global test utilities
export const TEST_USER = {
  id: 'test-user-id',
  email: 'test@ceylonexpand.com',
  name: 'Test User',
  role: 'user',
};

export const TEST_TRIP = {
  id: 'test-trip-id',
  title: 'Test Adventure Trip',
  fromLocation: 'Colombo',
  toLocation: 'Kandy',
  date: new Date('2024-12-01'),
  organizerId: TEST_USER.id,
};

// Mock API responses
export const mockApiResponse = {
  success: <T>(data: T) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) }),
  error: (status: number, message: string) => 
    Promise.resolve({ 
      ok: false, 
      status, 
      json: () => Promise.resolve({ error: message }) 
    }),
};