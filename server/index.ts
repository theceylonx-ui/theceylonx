import express, { type Request, Response, NextFunction } from "express";
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

// Security hardening
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*.clerk.dev", "*.clerk.com", "js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "*.clerk.dev", "*.clerk.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "*.unsplash.com", "*.googleusercontent.com", "*.facebook.com", "api.dicebear.com", "*.clerk.dev", "*.clerk.com"],
      connectSrc: ["'self'", "wss:", "ws:", "*.clerk.dev", "*.clerk.com", "api.clerk.dev", "api.clerk.com"],
      frameSrc: ["'self'", "*.clerk.dev", "*.clerk.com", "js.stripe.com"],
    },
  },
}));

// Global rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { message: "Too many requests from this IP, please try again later" }
}));

// JSON body size limit
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
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
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Validate critical environment variables
    const requiredEnvVars = ['DATABASE_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
      process.exit(1);
    }

    console.log('Starting server initialization...');
    
    // Production seeding - ensure sample data exists
    if (process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1') {
      console.log('🌱 Production environment detected - ensuring sample data...');
      try {
        // Test database connection first
        await import('../server/db');
        console.log('✅ Database connection verified');
        
        const { seedSampleTrips } = await import('../scripts/seed-trips');
        await seedSampleTrips();
        console.log('✅ Sample trips seeded successfully');
        
        // Run simple questions seeding
        const { seedSimpleQuestions } = await import('../scripts/seed-simple-questions');
        await seedSimpleQuestions();
        console.log('✅ Sample questions seeded successfully');
      } catch (error) {
        console.error('⚠️ Sample data seeding failed:', error.message || error);
        // Don't exit - continue with server startup
      }
    }
    
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      // Log the error for debugging
      console.error(`Error ${status}: ${message}`, err.stack);
      
      res.status(status).json({ message });
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log('Setting up Vite for development...');
      // Serve static assets from public folder BEFORE Vite setup
      const path = await import('path');
      const publicPath = path.resolve(import.meta.dirname, '..', 'public');
      app.use(express.static(publicPath));
      console.log('Static assets served from:', publicPath);
      await setupVite(app, server);
    } else {
      console.log('Setting up static file serving for production...');
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
