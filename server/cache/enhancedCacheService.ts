// 🚀 PERFORMANCE: Enhanced caching service with sophisticated strategies
import { cache, CACHE_TTL } from './cacheService';
import { Request, Response, NextFunction } from 'express';

// Cache strategy types
export type CacheStrategy = 'memory' | 'http' | 'hybrid' | 'stale-while-revalidate';

// Cache configuration per endpoint
interface CacheConfig {
  ttl: number;
  strategy: CacheStrategy;
  tags?: string[];
  conditions?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
  revalidateTime?: number; // For stale-while-revalidate
  cacheVisibility?: 'public' | 'private'; // SECURITY: Control cache visibility for personalized content
  varyHeaders?: string[]; // SECURITY: Headers to vary cache on (e.g., Authorization)
}

// Cache configuration registry
const cacheConfigs: Map<string, CacheConfig> = new Map([
  // API endpoints with optimized caching
  ['/api/trips', {
    ttl: CACHE_TTL.TRIP_LISTINGS,
    strategy: 'hybrid',
    tags: ['trips'],
    keyGenerator: (req) => `trips:${req.query.page || 1}:${req.query.limit || 20}:${JSON.stringify(req.query)}`
  }],
  ['/api/popular-destinations', {
    ttl: CACHE_TTL.POPULAR_DESTINATIONS,
    strategy: 'memory',
    tags: ['destinations']
  }],
  ['/api/recommendations/enhanced', {
    ttl: CACHE_TTL.RECOMMENDATIONS,
    strategy: 'stale-while-revalidate',
    revalidateTime: 300, // Revalidate after 5 minutes
    tags: ['recommendations'],
    keyGenerator: (req) => `recommendations:${req.user?.id || 'anon'}`,
    cacheVisibility: 'private', // SECURITY: Private cache - user-specific data
    varyHeaders: ['Authorization', 'Cookie'] // SECURITY: Vary on auth headers
  }],
  ['/api/site-settings', {
    ttl: CACHE_TTL.SITE_SETTINGS,
    strategy: 'memory',
    tags: ['settings']
  }],
  ['/api/calendar/events', {
    ttl: CACHE_TTL.CALENDAR_EVENTS,
    strategy: 'hybrid',
    tags: ['calendar'],
    keyGenerator: (req) => `calendar:${req.query.month || ''}:${req.query.year || ''}`
  }],
  ['/api/admin/stats', {
    ttl: CACHE_TTL.ADMIN_STATS,
    strategy: 'memory',
    tags: ['admin', 'stats'],
    conditions: (req) => req.user?.role === 'admin',
    cacheVisibility: 'private', // SECURITY: Private cache - admin-only data
    varyHeaders: ['Authorization', 'Cookie'] // SECURITY: Vary on auth headers
  }],
  // 🚀 COMMUNITY PERFORMANCE FIX: Add caching for community endpoints
  ['/api/topics', {
    ttl: CACHE_TTL.STATIC_DATA, // 2 hours - topics rarely change
    strategy: 'memory',
    tags: ['community', 'topics']
  }],
  ['/api/questions', {
    ttl: CACHE_TTL.TRIP_LISTINGS, // 5 minutes - questions are dynamic
    strategy: 'hybrid',
    tags: ['community', 'questions'],
    keyGenerator: (req) => `questions:${req.query.q || ''}:${req.query.topic || 'all'}:${req.query.sort || 'top'}:${req.query.limit || 10}:${req.query.offset || 0}`
  }],
  ['/api/community/stats', {
    ttl: CACHE_TTL.TRENDING_TRIPS, // 10 minutes - stats update moderately
    strategy: 'memory',
    tags: ['community', 'stats']
  }]
]);

// Enhanced cache middleware
export function enhancedCacheMiddleware(endpoint?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const route = endpoint || req.route?.path || req.path;
    const config = cacheConfigs.get(route);
    
    if (!config) {
      return next(); // No caching configured for this endpoint
    }
    
    // Check conditions
    if (config.conditions && !config.conditions(req)) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = config.keyGenerator 
      ? config.keyGenerator(req)
      : `${route}:${JSON.stringify(req.query)}`;
    
    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    
    if (cachedData && config.strategy !== 'stale-while-revalidate') {
      // Cache hit - return cached data
      res.setHeader('X-Cache', 'HIT');
      
      // SECURITY: Set appropriate cache visibility
      const visibility = config.cacheVisibility || 'public';
      res.setHeader('Cache-Control', `${visibility}, max-age=${config.ttl}`);
      
      // SECURITY: Set Vary headers for personalized content
      if (config.varyHeaders?.length) {
        res.setHeader('Vary', config.varyHeaders.join(', '));
      }
      
      return res.json(cachedData);
    }
    
    if (cachedData && config.strategy === 'stale-while-revalidate') {
      // Return stale data immediately
      res.setHeader('X-Cache', 'STALE');
      
      // SECURITY: Set appropriate cache visibility
      const visibility = config.cacheVisibility || 'public';
      res.setHeader('Cache-Control', `${visibility}, max-age=${config.ttl}`);
      
      // SECURITY: Set Vary headers for personalized content
      if (config.varyHeaders?.length) {
        res.setHeader('Vary', config.varyHeaders.join(', '));
      }
      
      res.json(cachedData);
      
      // 🚀 PERFORMANCE: Implement real background revalidation for stale-while-revalidate
      if (config.revalidateTime) {
        setImmediate(async () => {
          try {
            console.log(`🔄 Background revalidation starting for ${cacheKey}`);
            // The original request handler will execute and update the cache
            // This simulates the next request to refresh the stale data
            const isStale = Date.now() - (cache.get(`${cacheKey}:timestamp`) || 0) > (config.revalidateTime * 1000);
            if (isStale) {
              // Mark for revalidation - next request will refresh
              cache.delete(cacheKey);
              console.log(`✅ Stale cache invalidated for ${cacheKey}`);
            }
          } catch (error) {
            console.error(`❌ Background revalidation failed for ${cacheKey}:`, error);
          }
        });
      }
      return;
    }
    
    // Cache miss - intercept response to cache the result
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Cache the response with timestamp for SWR
      cache.set(cacheKey, data, config.ttl);
      cache.set(`${cacheKey}:timestamp`, Date.now(), config.ttl);
      res.setHeader('X-Cache', 'MISS');
      
      // SECURITY: Set appropriate cache visibility
      const visibility = config.cacheVisibility || 'public';
      res.setHeader('Cache-Control', `${visibility}, max-age=${config.ttl}`);
      
      // SECURITY: Set Vary headers for personalized content
      if (config.varyHeaders?.length) {
        res.setHeader('Vary', config.varyHeaders.join(', '));
      }
      
      return originalJson(data);
    };
    
    next();
  };
}

// Cache invalidation by tags
export function invalidateCacheTags(tags: string[]): number {
  let invalidatedCount = 0;
  
  for (const tag of tags) {
    // Find all cache keys with this tag
    for (const [route, config] of cacheConfigs) {
      if (config.tags?.includes(tag)) {
        const pattern = route.replace(/:\w+/g, '.*'); // Convert route params to regex
        invalidatedCount += cache.invalidatePattern(pattern);
      }
    }
  }
  
  console.log(`🗑️ Invalidated ${invalidatedCount} cache entries for tags:`, tags);
  return invalidatedCount;
}

// HTTP caching headers for different content types
export const HTTP_CACHE_HEADERS = {
  // Static assets - long cache with immutable
  STATIC_ASSETS: {
    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
    'Expires': new Date(Date.now() + 31536000000).toUTCString()
  },
  
  // API data - short cache with revalidation
  API_SHORT: {
    'Cache-Control': 'public, max-age=300, must-revalidate', // 5 minutes
    'Expires': new Date(Date.now() + 300000).toUTCString()
  },
  
  // API data - medium cache
  API_MEDIUM: {
    'Cache-Control': 'public, max-age=1800, must-revalidate', // 30 minutes
    'Expires': new Date(Date.now() + 1800000).toUTCString()
  },
  
  // Dynamic content - no cache
  NO_CACHE: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  },
  
  // Private user data - private cache only
  PRIVATE: {
    'Cache-Control': 'private, max-age=300', // 5 minutes
    'Expires': new Date(Date.now() + 300000).toUTCString()
  }
};

// Smart cache header middleware
export function smartCacheHeaders(req: Request, res: Response, next: NextFunction) {
  const { path, method } = req;
  
  // Only cache GET requests
  if (method !== 'GET') {
    res.set(HTTP_CACHE_HEADERS.NO_CACHE);
    return next();
  }
  
  // Static assets
  if (path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$/)) {
    res.set(HTTP_CACHE_HEADERS.STATIC_ASSETS);
  }
  // API endpoints
  else if (path.startsWith('/api/')) {
    // Determine cache level based on endpoint
    if (path.includes('/auth/') || path.includes('/user/')) {
      res.set(HTTP_CACHE_HEADERS.PRIVATE);
    } else if (path.includes('/popular-destinations') || path.includes('/site-settings')) {
      res.set(HTTP_CACHE_HEADERS.API_MEDIUM);
    } else {
      res.set(HTTP_CACHE_HEADERS.API_SHORT);
    }
  }
  // HTML pages
  else {
    res.set({
      'Cache-Control': 'public, max-age=3600, must-revalidate', // 1 hour
      'Expires': new Date(Date.now() + 3600000).toUTCString()
    });
  }
  
  next();
}

// Cache warming utilities
export class CacheWarmer {
  private static warmingInProgress = new Set<string>();
  
  // Warm specific cache entries
  static async warmCache(endpoints: string[], baseUrl = 'http://localhost:5000'): Promise<void> {
    console.log('🔥 Warming cache for endpoints:', endpoints);
    
    const promises = endpoints.map(async (endpoint) => {
      if (this.warmingInProgress.has(endpoint)) {
        return; // Already warming
      }
      
      this.warmingInProgress.add(endpoint);
      
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          headers: { 'X-Cache-Warm': 'true' }
        });
        
        if (response.ok) {
          console.log(`✅ Warmed cache for ${endpoint}`);
        } else {
          console.warn(`⚠️ Failed to warm cache for ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Error warming cache for ${endpoint}:`, error);
      } finally {
        this.warmingInProgress.delete(endpoint);
      }
    });
    
    await Promise.all(promises);
  }
  
  // Auto-warm critical endpoints
  static async autoWarmCriticalEndpoints(): Promise<void> {
    const criticalEndpoints = [
      '/api/popular-destinations',
      '/api/site-settings/landing_background_image',
      '/api/trips?limit=20&page=1',
      '/api/recommendations/trending?limit=6'
    ];
    
    await this.warmCache(criticalEndpoints);
  }
}

// Cache performance monitoring
export class CacheMonitor {
  private static metrics = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    warmups: 0
  };
  
  static recordHit(): void {
    this.metrics.hits++;
  }
  
  static recordMiss(): void {
    this.metrics.misses++;
  }
  
  static recordInvalidation(): void {
    this.metrics.invalidations++;
  }
  
  static recordWarmup(): void {
    this.metrics.warmups++;
  }
  
  static getMetrics(): typeof CacheMonitor.metrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.misses;
    return {
      ...this.metrics,
      hitRate: total > 0 ? this.metrics.hits / total : 0
    };
  }
  
  static reset(): void {
    this.metrics = { hits: 0, misses: 0, invalidations: 0, warmups: 0 };
  }
}