import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { checkClerkEnv } from "./utils/checkClerk";

// Log startup information
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Starting Ceylon Expand server...');

// Check Clerk environment configuration
const clerkCheck = checkClerkEnv();
console.log('[Clerk Env Check]', clerkCheck);
if (!clerkCheck.ok) {
  console.warn('⚠️ Clerk env invalid. Auth will be disabled until fixed.');
  clerkCheck.problems.forEach(problem => console.warn(`  - ${problem}`));
}

const app = express();

// Trust proxy for proper IP detection (required for rate limiting in production)
app.set('trust proxy', 1);

// CRITICAL: In development, mount Vite FIRST before any middleware
const isDevelopment = app.get('env') === 'development';
const isProduction = !isDevelopment;

// SECURITY: Enterprise-grade unified CSP policy with minimal permissions  
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // SECURITY: Strict script sources - no wildcards or unsafe directives in production
      scriptSrc: [
        "'self'",
        // SECURITY: Only specific trusted domains - no wildcards
        "https://js.stripe.com", // Stripe payments (specific URL)
        "https://replit.com", // Replit development banner (development mode)
        // SECURITY: Clerk domains only if configured
        ...(process.env.CLERK_PUBLISHABLE_KEY ? ["https://clerk.ceylonx.com"] : []),
        // SECURITY: Only allow unsafe-eval and blob: in development for HMR
        ...(isDevelopment ? ["'unsafe-eval'", "blob:"] : []),
      ].filter(Boolean),
      // SECURITY: Strict style sources with minimal inline permissions
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com", // Google Fonts styles
        // SECURITY: Specific style hashes for critical inline styles only
        "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='", // Empty style hash
        // SECURITY: Allow unsafe-inline and blob: only in development for hot reload
        ...(isDevelopment ? ["'unsafe-inline'", "blob:"] : []),
        // SECURITY: Clerk styles only if configured
        ...(process.env.CLERK_PUBLISHABLE_KEY ? ["https://clerk.ceylonx.com"] : []),
      ].filter(Boolean),
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com", // Google Fonts
        "https://fonts.googleapis.com" // Google Fonts fallback
      ],
      // SECURITY: Tightened image sources - removed wildcards
      imgSrc: [
        "'self'",
        "data:", // Data URLs for inline images
        "blob:", // Blob URLs for user uploads and Vite HMR
        // SECURITY: Specific image domains only - no wildcards
        "https://images.unsplash.com", // Unsplash (specific subdomain)
        "https://lh3.googleusercontent.com", // Google profile images (specific subdomain)
        "https://graph.facebook.com", // Facebook profile images (specific API endpoint)
        "https://api.dicebear.com", // Avatar service
        // SECURITY: Clerk assets only if configured
        ...(process.env.CLERK_PUBLISHABLE_KEY ? ["https://clerk.ceylonx.com"] : []),
      ].filter(Boolean),
      // SECURITY: Strict connection sources - removed broad wss:// and ws:// wildcards
      connectSrc: [
        "'self'",
        // SECURITY: Allow broader connections in development for Vite HMR
        ...(isDevelopment ? [
          "ws:",     // WebSocket on any host for Vite HMR
          "wss:",    // Secure WebSocket on any host for Vite HMR
          "http:",   // HTTP for development
          "https:",  // HTTPS for development
        ] : [
          // SECURITY: Specific endpoints only in production
          "https://api.clerk.com", // Clerk API
          "https://api.stripe.com", // Stripe API
        ]),
        // SECURITY: Clerk domains only if configured
        ...(process.env.CLERK_PUBLISHABLE_KEY ? ["https://clerk.ceylonx.com"] : []),
      ].filter(Boolean),
      frameSrc: [
        "'self'",
        "https://js.stripe.com", // Stripe iframe
        // SECURITY: Clerk iframe only if configured
        ...(process.env.CLERK_PUBLISHABLE_KEY ? ["https://clerk.ceylonx.com"] : []),
      ].filter(Boolean),
      objectSrc: ["'none'"], // SECURITY: Disable object/embed for security  
      baseUri: ["'self'"], // SECURITY: Prevent base tag injection
      formAction: ["'self'"], // SECURITY: Restrict form submissions
      frameAncestors: ["'none'"], // SECURITY: Prevent embedding in iframes
    },
  },
  // SECURITY: Additional production security headers
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: ['strict-origin-when-cross-origin'] }, // SECURITY: Stricter referrer policy
  crossOriginEmbedderPolicy: isProduction, // SECURITY: Disable COEP in development for Vite
  crossOriginOpenerPolicy: isProduction, // SECURITY: Disable COOP in development for Vite
  crossOriginResourcePolicy: { policy: 'same-origin' } // SECURITY: Restrict cross-origin resources
};

// Apply security and API middleware scoped to /api routes
app.use('/api', helmet(helmetConfig));
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { message: "Too many requests from this IP, please try again later" }
}));
app.use('/api', express.json({ limit: '20mb' }));
app.use('/api', express.urlencoded({ extended: false, limit: '20mb' }));

// 🚀 PERFORMANCE: Integrate all performance optimization middleware
import { 
  intelligentCompression,
  responseTimeTracking,
  requestSizeLimit,
  queryOptimizationMiddleware,
  apiResponseOptimization,
  memoryMonitoring,
  paginationOptimization,
  performanceMiddlewareStack
} from "./middleware/performanceOptimization";
import { smartCacheHeaders } from "./cache/enhancedCacheService";

// Apply performance middleware stack to /api routes
console.log('🚀 Applying performance optimizations...');
app.use('/api', performanceMiddlewareStack);
console.log('✅ Performance middleware integrated successfully');

// Security-hardened request logging middleware (enhanced with performance tracking)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  // SECURITY: Import secure logging utilities dynamically
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // 🚀 PERFORMANCE: Add performance indicators to logs
      if (duration > 1000) {
        logLine += ' 🐌'; // Slow request indicator
      } else if (duration < 100) {
        logLine += ' ⚡'; // Fast request indicator
      }
      
      // SECURITY: Sanitize response body to prevent PII leakage
      if (capturedJsonResponse) {
        // Avoid logging response bodies that might contain PII
        const hasUserData = capturedJsonResponse.email || capturedJsonResponse.name || capturedJsonResponse.user || capturedJsonResponse.users;
        if (!hasUserData && typeof capturedJsonResponse === 'object') {
          const sanitized = capturedJsonResponse.error || capturedJsonResponse.message ? 
            { error: capturedJsonResponse.error, message: capturedJsonResponse.message } : 
            '[RESPONSE_OMITTED]';
          logLine += ` :: ${JSON.stringify(sanitized)}`;
        }
      }

      if (logLine.length > 100) {
        logLine = logLine.slice(0, 99) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Validate critical environment variables (production only)
    if (isProduction) {
      const requiredEnvVars = ['DATABASE_URL'];
      const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
      
      if (missingEnvVars.length > 0) {
        console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
        process.exit(1);
      }
    }

    console.log('Starting server initialization...');
    
    // Create the server first (needed for Vite setup)
    const server = createServer(app);
    
    // CRITICAL: Register API routes BEFORE Vite to prevent catch-all interception
    await registerRoutes(app);
    console.log('Routes registered successfully');
    
    // Mount Vite AFTER routes are registered
    if (isDevelopment) {
      console.log('Setting up Vite for development...');
      const { setupVite } = await import('./vite');
      await setupVite(app, server);
    }

    // Initialize idempotency system for data integrity
    console.log('Initializing idempotency system...');
    const { initializeIdempotencyTable, cleanupExpiredKeys } = await import('./utils/idempotencyHandler');
    
    // Initialize idempotency table (non-blocking in development)
    if (process.env.NODE_ENV === 'production') {
      await initializeIdempotencyTable();
      console.log('Idempotency system initialized successfully');
    } else {
      // In development, don't block server startup if idempotency initialization fails
      initializeIdempotencyTable()
        .then(() => console.log('Idempotency system initialized successfully'))
        .catch(error => console.warn('⚠️ Idempotency initialization failed (non-blocking in development):', error.message));
    }

    // Start scheduled cleanup for expired idempotency keys
    console.log('Starting idempotency cleanup scheduler...');
    const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
    let cleanupIntervalId: NodeJS.Timeout;
    
    const runCleanup = async () => {
      try {
        const cleanedCount = await cleanupExpiredKeys();
        if (cleanedCount > 0) {
          console.log(`🧹 Scheduled cleanup: Removed ${cleanedCount} expired idempotency keys`);
        } else {
          console.log('🧹 Scheduled cleanup: No expired idempotency keys found');
        }
      } catch (error) {
        console.error('❌ Scheduled idempotency cleanup failed:', error);
      }
    };
    
    // Run initial cleanup after 5 minutes (to let server fully start)
    setTimeout(runCleanup, 5 * 60 * 1000);
    
    // Schedule recurring cleanup every 6 hours
    cleanupIntervalId = setInterval(runCleanup, CLEANUP_INTERVAL_MS);
    console.log('✅ Idempotency cleanup scheduler started (every 6 hours)');

    // API error handler - scoped to /api routes
    app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log the error for debugging
      console.error(`API Error ${status}: ${message}`, err.stack);
      
      res.status(status).json({ message });
    });

    // Setup static file serving for production (Vite already set up in dev)
    if (!isDevelopment) {
      console.log('Setting up static file serving for production...');
      const { serveStatic } = await import('./vite');
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      console.log('Server startup completed successfully');
      console.log('💡 To seed sample data, call POST /api/admin/seed-data after deployment');
    });
    
    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', (error as Error).message);
    console.error('Stack trace:', (error as Error).stack);
    
    // Exit with error code to signal deployment failure
    process.exit(1);
  }
})();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
