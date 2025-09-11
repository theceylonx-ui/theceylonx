// 🚀 PHASE 3 PERFORMANCE: Intelligent in-memory caching service
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  private maxSize = 1000; // Maximum cache entries
  
  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.data;
  }
  
  /**
   * Set cached data with TTL (time to live)
   */
  set<T>(key: string, data: T, ttlSeconds = 300): void { // Default 5 minutes
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
    
    this.stats.sets++;
  }
  
  /**
   * Delete cached data
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }
  
  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
  
  /**
   * Get or set cached data with a function
   */
  async getOrSet<T>(
    key: string, 
    fetchFunction: () => Promise<T>, 
    ttlSeconds = 300
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Fetch fresh data
    const data = await fetchFunction();
    
    // Cache it
    this.set(key, data, ttlSeconds);
    
    return data;
  }
  
  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    // Convert keys to array to avoid iterator issues
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.deletes += deletedCount;
    return deletedCount;
  }
}

// Global cache instance
export const cache = new CacheService();

// Cache TTL constants for different data types
export const CACHE_TTL = {
  POPULAR_DESTINATIONS: 3600, // 1 hour - rarely changes
  SITE_SETTINGS: 1800, // 30 minutes - moderately static
  TRIP_LISTINGS: 300, // 5 minutes - dynamic data
  USER_PROFILES: 600, // 10 minutes - semi-static
  SEARCH_RESULTS: 60, // 1 minute - very dynamic
  STATIC_DATA: 7200, // 2 hours - very rarely changes
  // 🚀 PERFORMANCE: Enhanced cache TTL for different content types
  AUTH_USER: 900, // 15 minutes - user auth data
  RECOMMENDATIONS: 1800, // 30 minutes - AI recommendations
  TRENDING_TRIPS: 600, // 10 minutes - trending data
  CALENDAR_EVENTS: 300, // 5 minutes - calendar data
  CHAT_THREADS: 120, // 2 minutes - chat data (semi-realtime)
  NOTIFICATIONS: 60, // 1 minute - notification data
  API_METADATA: 3600, // 1 hour - API structure/metadata
  ADMIN_STATS: 300, // 5 minutes - admin dashboard stats
};