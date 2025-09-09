// 🚀 PHASE 4: Production environment configuration
import { z } from 'zod';

// Production environment validation schema
const productionConfigSchema = z.object({
  // Core settings
  NODE_ENV: z.literal('production'),
  PORT: z.string().transform(Number).default('5000'),
  
  // Database
  DATABASE_URL: z.string().url(),
  POSTGRES_SSL: z.enum(['true', 'false']).default('true'),
  
  // Authentication & Security
  SESSION_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  CLERK_SECRET_KEY: z.string().optional(),
  
  // CORS and domains
  CORS_ALLOWED_ORIGINS: z.string(),
  DOMAIN: z.string().url(),
  
  // External services
  SENDGRID_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Performance
  CACHE_TTL_DEFAULT: z.string().transform(Number).default('300000'), // 5 minutes
  
  // Object Storage (if enabled)
  DEFAULT_OBJECT_STORAGE_BUCKET_ID: z.string().optional(),
  PRIVATE_OBJECT_DIR: z.string().optional(),
  PUBLIC_OBJECT_SEARCH_PATHS: z.string().optional(),
});

export type ProductionConfig = z.infer<typeof productionConfigSchema>;

// Validate and export production configuration
export function validateProductionConfig(): ProductionConfig {
  try {
    const config = productionConfigSchema.parse(process.env);
    console.log('✅ Production configuration validated successfully');
    return config;
  } catch (error) {
    console.error('❌ Production configuration validation failed:', error);
    process.exit(1);
  }
}

// Production-specific settings
export const productionSettings = {
  security: {
    // Enhanced security for production
    trustProxy: true,
    secureHeaders: true,
    httpsOnly: true,
    strictCSP: true,
  },
  
  performance: {
    // Performance optimizations
    compressionEnabled: true,
    cacheHeaders: true,
    staticAssetCaching: '1d', // 1 day
    apiCacheHeaders: '5m', // 5 minutes
  },
  
  monitoring: {
    // Production monitoring
    healthChecksEnabled: true,
    metricsEnabled: true,
    errorReportingEnabled: true,
    performanceLoggingEnabled: true,
  },
  
  database: {
    // Production database settings
    connectionPoolSize: 10,
    connectionTimeout: 30000,
    queryTimeout: 10000,
    ssl: true,
  },
  
  rateLimit: {
    // Production rate limiting
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    skipSuccessfulRequests: false,
  },
} as const;