// 🚀 PERFORMANCE: Comprehensive API optimization middleware
import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { cache, CACHE_TTL } from '../cache/cacheService';
import { enhancedCacheMiddleware, smartCacheHeaders } from '../cache/enhancedCacheService';

// Response compression middleware with intelligent selection
export const intelligentCompression = compression({
  level: 6, // Good balance between compression and CPU usage
  threshold: 1024, // Only compress responses > 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Don't compress images, videos, or already compressed content
    const contentType = res.getHeader('Content-Type') as string;
    if (contentType) {
      if (contentType.includes('image/') || 
          contentType.includes('video/') ||
          contentType.includes('audio/') ||
          contentType.includes('application/zip') ||
          contentType.includes('application/gzip')) {
        return false;
      }
    }
    
    // Use default compression filter for other content
    return compression.filter(req, res);
  }
});

// Response time tracking middleware
export const responseTimeTracking = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime();
  
  // Set response time header before response is sent
  const originalEnd = res.end.bind(res);
  res.end = function(...args: any[]) {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    try {
      // Only set header if response hasn't been sent yet
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
      }
    } catch (error) {
      // Silently ignore header setting errors to prevent crashes
      console.debug('Could not set response time header:', error);
    }
    
    return originalEnd.apply(res, args);
  };
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) { // > 1 second
      console.warn(`🐌 Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
    
    // Track metrics (could be sent to monitoring service)
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

// Request size limiting for performance
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: 'Request too large',
        message: `Request size ${contentLength} bytes exceeds limit of ${maxSize} bytes`
      });
    }
    
    next();
  };
};

// Database query optimization middleware
export const queryOptimizationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add query optimization hints to request
  (req as any).queryOptimizations = {
    useCache: true,
    preferIndexedQueries: true,
    batchQueries: true,
    maxQueryTime: 5000 // 5 seconds max query time
  };
  
  next();
};

// API response optimization
export const apiResponseOptimization = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data: any) {
    // Remove null/undefined values to reduce payload size
    const cleanData = removeEmptyValues(data);
    
    // Add performance headers
    res.setHeader('X-API-Version', '3.0');
    res.setHeader('X-Content-Optimized', 'true');
    
    // Minify response in production
    if (process.env.NODE_ENV === 'production') {
      return originalJson(cleanData);
    }
    
    return originalJson(cleanData);
  };
  
  next();
};

// Helper function to remove empty values
function removeEmptyValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeEmptyValues).filter(Boolean);
  }

  // Dates (and other non-plain objects) have no own enumerable properties,
  // so walking them with Object.entries() would silently flatten them to {}.
  if (obj instanceof Date) {
    return obj;
  }

  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = removeEmptyValues(value);
      }
    }
    return cleaned;
  }

  return obj;
}

// Memory usage monitoring
export const memoryMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const memoryBefore = process.memoryUsage();
  
  // Set memory header before response is sent
  const originalEnd = res.end.bind(res);
  res.end = function(...args: any[]) {
    const memoryAfter = process.memoryUsage();
    const heapDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;
    
    try {
      // Add memory usage header for debugging (only if headers not sent)
      if (process.env.NODE_ENV === 'development' && !res.headersSent) {
        res.setHeader('X-Memory-Used', `${(heapDiff / 1024 / 1024).toFixed(2)}MB`);
      }
    } catch (error) {
      // Silently ignore header setting errors to prevent crashes
      console.debug('Could not set memory usage header:', error);
    }
    
    return originalEnd.apply(res, args);
  };
  
  res.on('finish', () => {
    const memoryAfter = process.memoryUsage();
    const heapDiff = memoryAfter.heapUsed - memoryBefore.heapUsed;
    
    // Log memory-intensive requests
    if (heapDiff > 10 * 1024 * 1024) { // > 10MB
      console.warn(`🧠 Memory intensive request: ${req.method} ${req.path} used ${(heapDiff / 1024 / 1024).toFixed(2)}MB`);
    }
  });
  
  next();
};

// Pagination helper middleware
export const paginationOptimization = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 items per page
  const offset = (page - 1) * limit;
  
  // Add pagination data to request
  (req as any).pagination = {
    page,
    limit,
    offset,
    maxLimit: 100
  };
  
  // Helper to add pagination metadata to response
  (res as any).paginate = function(data: any[], total: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null
      }
    };
  };
  
  next();
};

// Request batching optimization
export const requestBatchingOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Enable request batching for specific endpoints
  if (req.path.includes('/api/batch')) {
    (req as any).enableBatching = true;
    
    try {
      // Only set header if response hasn't been sent yet
      if (!res.headersSent) {
        res.setHeader('X-Batching-Enabled', 'true');
      }
    } catch (error) {
      // Silently ignore header setting errors to prevent crashes
      console.debug('Could not set batching header:', error);
    }
  }
  
  next();
};

// ETags for better caching
export const etagOptimization = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data: any) {
    // Generate ETag from data hash
    const etag = generateETag(data);
    res.setHeader('ETag', etag);
    
    // Check if client has cached version
    const clientETag = req.headers['if-none-match'];
    if (clientETag === etag) {
      return res.status(304).end();
    }
    
    return originalJson(data);
  };
  
  next();
};

// Simple ETag generation
function generateETag(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

// Content-Type optimization
export const contentTypeOptimization = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  
  res.json = function(data: any) {
    // Only set headers if they haven't been sent yet
    if (!res.headersSent) {
      // Set optimized content type
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
    
    return originalJson(data);
  };
  
  next();
};

// Database connection pooling optimization
export const connectionPoolOptimization = (req: Request, res: Response, next: NextFunction) => {
  // Add connection pool hints
  (req as any).dbOptimizations = {
    preferReadReplica: req.method === 'GET',
    useTransaction: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method),
    isolationLevel: 'READ_COMMITTED'
  };
  
  next();
};

// Performance budget enforcement
export const performanceBudgetEnforcement = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const MAX_RESPONSE_TIME = 5000; // 5 seconds
  
  // Set timeout for the request
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        message: 'Request took too long to process'
      });
    }
  }, MAX_RESPONSE_TIME);
  
  res.on('finish', () => {
    clearTimeout(timeout);
    const duration = Date.now() - startTime;
    
    // Log performance budget violations
    if (duration > MAX_RESPONSE_TIME * 0.8) { // 80% of budget
      console.warn(`⚠️ Performance budget warning: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};

// Combined performance middleware stack
export const performanceMiddlewareStack = [
  responseTimeTracking,
  requestSizeLimit(),
  intelligentCompression,
  queryOptimizationMiddleware,
  apiResponseOptimization,
  memoryMonitoring,
  paginationOptimization,
  requestBatchingOptimization,
  etagOptimization,
  contentTypeOptimization,
  connectionPoolOptimization,
  performanceBudgetEnforcement,
  smartCacheHeaders
];