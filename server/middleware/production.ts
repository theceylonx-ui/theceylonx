import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { envConfig, isProduction } from '../config/environment';

// 🚀 PHASE 4: Production security middleware
export const productionSecurityMiddleware = () => {
  const middlewares: any[] = [];
  
  if (isProduction()) {
    // SECURITY: Removed duplicate CSP - unified CSP is handled in server/index.ts
    // Only add production-specific non-CSP security headers here
    middlewares.push(
      helmet({
        // SECURITY: Disable CSP here to avoid conflicts with main CSP in index.ts
        contentSecurityPolicy: false,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      })
    );
    
    // Compression for production
    middlewares.push(
      compression({
        level: 6,
        threshold: 1024,
        filter: (req: Request, res: Response) => {
          if (req.headers['x-no-compression']) {
            return false;
          }
          return compression.filter(req, res);
        },
      })
    );
  }
  
  return middlewares;
};

// Production cache headers middleware
export const cacheHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!isProduction()) {
    return next();
  }
  
  const { path } = req;
  
  // Static assets - long cache
  if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', `public, max-age=${24 * 60 * 60}, immutable`); // 1 day
  }
  // API endpoints - short cache
  else if (path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
  }
  // HTML pages - moderate cache
  else {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
  }
  
  next();
};

// Production error handler middleware
export const productionErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('🚨 Production Error:', {
    error: error.message,
    stack: isProduction() ? undefined : error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  
  // Don't leak error details in production
  if (isProduction()) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong. Please try again later.',
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
};

// Request logging middleware for production
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString(),
    };
    
    if (isProduction()) {
      // In production, log in structured format for analysis
      console.log(JSON.stringify(logData));
    } else {
      // Development-friendly logging
      console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
    }
  });
  
  next();
};