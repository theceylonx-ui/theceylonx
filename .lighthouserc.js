/**
 * Ceylon Expand - Lighthouse CI Configuration
 * Performance testing and quality metrics
 */
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run build && npm start',
      startServerReadyPattern: 'Server startup completed',
      url: ['http://localhost:5000', 'http://localhost:5000/trips'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off', // Not a PWA yet
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
