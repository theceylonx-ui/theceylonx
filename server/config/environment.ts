// 🚀 PHASE 4: Environment configuration manager
import { validateProductionConfig, productionSettings } from './production';

export type Environment = 'development' | 'production' | 'test';

export const getEnvironment = (): Environment => {
  // Replit sets REPLIT_DEPLOYMENT=1 during production deployment
  if (process.env.REPLIT_DEPLOYMENT === '1') {
    return 'production';
  }
  return (process.env.NODE_ENV as Environment) || 'development';
};

export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

export const isTest = (): boolean => {
  return getEnvironment() === 'test';
};

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      return {
        ...productionSettings,
        config: validateProductionConfig(),
      };
      
    case 'development':
      return {
        security: {
          trustProxy: false,
          secureHeaders: false,
          httpsOnly: false,
          strictCSP: false,
        },
        performance: {
          compressionEnabled: false,
          cacheHeaders: false,
          staticAssetCaching: '0',
          apiCacheHeaders: '0',
        },
        monitoring: {
          healthChecksEnabled: true,
          metricsEnabled: true,
          errorReportingEnabled: false,
          performanceLoggingEnabled: true,
        },
        database: {
          connectionPoolSize: 5,
          connectionTimeout: 30000,
          queryTimeout: 10000,
          ssl: false,
        },
        rateLimit: {
          enabled: false,
          windowMs: 15 * 60 * 1000,
          max: 1000,
          skipSuccessfulRequests: true,
        },
        config: {
          NODE_ENV: getEnvironment(),
          PORT: parseInt(process.env.PORT || '5000'),
          DATABASE_URL: process.env.DATABASE_URL || '',
        },
      };
      
    case 'test':
      return {
        security: {
          trustProxy: false,
          secureHeaders: false,
          httpsOnly: false,
          strictCSP: false,
        },
        performance: {
          compressionEnabled: false,
          cacheHeaders: false,
          staticAssetCaching: '0',
          apiCacheHeaders: '0',
        },
        monitoring: {
          healthChecksEnabled: false,
          metricsEnabled: false,
          errorReportingEnabled: false,
          performanceLoggingEnabled: false,
        },
        database: {
          connectionPoolSize: 2,
          connectionTimeout: 5000,
          queryTimeout: 5000,
          ssl: false,
        },
        rateLimit: {
          enabled: false,
          windowMs: 15 * 60 * 1000,
          max: 10000,
          skipSuccessfulRequests: true,
        },
        config: {
          NODE_ENV: 'test',
          PORT: 0, // Random port for tests
          DATABASE_URL: process.env.TEST_DATABASE_URL || '',
        },
      };
      
    default:
      throw new Error(`Unknown environment: ${env}`);
  }
};

// Export current environment config
export const envConfig = getEnvironmentConfig();