// 🚀 APPLICATION PERFORMANCE MONITORING (APM) - Production-ready performance tracking
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import os from 'os';

// Performance metrics interfaces
interface ApiMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userAgent?: string;
  userId?: string;
  errorMessage?: string;
}

interface DatabaseMetrics {
  queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER';
  duration: number;
  timestamp: Date;
  tableName?: string;
  success: boolean;
  errorMessage?: string;
}

interface SystemMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  loadAverage: number[];
  activeConnections: number;
}

interface UserSessionMetrics {
  userId: string;
  sessionId: string;
  action: string;
  timestamp: Date;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
}

// APM Configuration
interface APMConfig {
  enabled: boolean;
  sampleRate: number; // 0.0 to 1.0 (0% to 100%)
  slowQueryThreshold: number; // ms
  slowApiThreshold: number; // ms
  maxMetricsBufferSize: number;
  flushInterval: number; // ms
}

class APMService {
  private config: APMConfig;
  private apiMetrics: ApiMetrics[] = [];
  private dbMetrics: DatabaseMetrics[] = [];
  private systemMetrics: SystemMetrics[] = [];
  private userSessionMetrics: UserSessionMetrics[] = [];
  private flushTimer?: NodeJS.Timeout;
  
  // Performance statistics
  private stats = {
    totalRequests: 0,
    errorRequests: 0,
    slowRequests: 0,
    totalDbQueries: 0,
    slowDbQueries: 0,
    averageResponseTime: 0,
    peakMemoryUsage: 0,
    uptime: Date.now()
  };

  constructor(config: Partial<APMConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_APM === 'true',
      sampleRate: parseFloat(process.env.APM_SAMPLE_RATE || '1.0'),
      slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || '1000'),
      slowApiThreshold: parseInt(process.env.SLOW_API_THRESHOLD_MS || '2000'),
      maxMetricsBufferSize: parseInt(process.env.APM_BUFFER_SIZE || '10000'),
      flushInterval: parseInt(process.env.APM_FLUSH_INTERVAL_MS || '60000'), // 1 minute
      ...config
    };

    if (this.config.enabled) {
      this.startSystemMetricsCollection();
      this.startPeriodicFlush();
      console.log('🚀 APM Service initialized and collecting metrics');
    }
  }

  // Check if current request should be sampled
  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  // API Performance Monitoring Middleware
  createApiMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.config.enabled || !this.shouldSample()) {
        return next();
      }

      const startTime = performance.now();
      const startTimestamp = new Date();

      // Capture response data
      const originalSend = res.send;
      const originalJson = res.json;
      let errorMessage: string | undefined;

      res.send = function(data: any) {
        if (res.statusCode >= 400) {
          try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            errorMessage = parsed?.message || parsed?.error || 'Unknown error';
          } catch {
            errorMessage = 'Parse error';
          }
        }
        return originalSend.call(this, data);
      };

      res.json = function(data: any) {
        if (res.statusCode >= 400) {
          errorMessage = data?.message || data?.error || 'Unknown error';
        }
        return originalJson.call(this, data);
      };

      // Track completion
      res.on('finish', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        const metrics: ApiMetrics = {
          endpoint: this.normalizeEndpoint(req.path),
          method: req.method,
          responseTime,
          statusCode: res.statusCode,
          timestamp: startTimestamp,
          userAgent: req.get('User-Agent'),
          userId: (req as any).user?.id,
          errorMessage
        };

        this.recordApiMetric(metrics);
      });

      next();
    };
  }

  // Record API performance metric
  private recordApiMetric(metric: ApiMetrics): void {
    this.stats.totalRequests++;
    
    if (metric.statusCode >= 400) {
      this.stats.errorRequests++;
    }
    
    if (metric.responseTime > this.config.slowApiThreshold) {
      this.stats.slowRequests++;
      console.warn(`🐌 Slow API endpoint: ${metric.method} ${metric.endpoint} took ${metric.responseTime.toFixed(2)}ms`);
    }

    // Update average response time (sliding window)
    this.stats.averageResponseTime = (this.stats.averageResponseTime * 0.9) + (metric.responseTime * 0.1);

    // Store metric
    this.apiMetrics.push(metric);
    this.trimBuffer(this.apiMetrics, 'api');
  }

  // Database Performance Monitoring
  recordDatabaseMetric(queryType: string, duration: number, success: boolean, tableName?: string, errorMessage?: string): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    const metric: DatabaseMetrics = {
      queryType: this.normalizeQueryType(queryType),
      duration,
      timestamp: new Date(),
      tableName,
      success,
      errorMessage
    };

    this.stats.totalDbQueries++;
    
    if (duration > this.config.slowQueryThreshold) {
      this.stats.slowDbQueries++;
      console.warn(`🐌 Slow database query: ${queryType} on ${tableName} took ${duration}ms`);
    }

    if (!success) {
      console.error(`❌ Database query failed: ${queryType} on ${tableName}: ${errorMessage}`);
    }

    this.dbMetrics.push(metric);
    this.trimBuffer(this.dbMetrics, 'database');
  }

  // User Session Tracking
  recordUserSessionMetric(userId: string, sessionId: string, action: string, success: boolean, duration?: number, metadata?: Record<string, any>): void {
    if (!this.config.enabled || !this.shouldSample()) return;

    const metric: UserSessionMetrics = {
      userId,
      sessionId,
      action,
      timestamp: new Date(),
      duration,
      success,
      metadata
    };

    this.userSessionMetrics.push(metric);
    this.trimBuffer(this.userSessionMetrics, 'user_session');
  }

  // System Metrics Collection
  private startSystemMetricsCollection(): void {
    const collectMetrics = () => {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      // Track peak memory usage
      if (memUsage.heapUsed > this.stats.peakMemoryUsage) {
        this.stats.peakMemoryUsage = memUsage.heapUsed;
      }

      const metric: SystemMetrics = {
        timestamp: new Date(),
        cpuUsage: cpuUsage.user / 1000000, // Convert to ms
        memoryUsage: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        },
        loadAverage: os.loadavg(),
        activeConnections: 0 // TODO: Track actual connections
      };

      this.systemMetrics.push(metric);
      this.trimBuffer(this.systemMetrics, 'system');
    };

    // Collect system metrics every 30 seconds
    setInterval(collectMetrics, 30000);
    collectMetrics(); // Initial collection
  }

  // Periodic data flush and aggregation
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.config.flushInterval);
  }

  // Flush metrics (in production, send to external monitoring service)
  private flushMetrics(): void {
    const summary = this.getMetricsSummary();
    
    // In production, send to monitoring service (e.g., DataDog, New Relic, etc.)
    console.log('📊 APM Metrics Summary:', JSON.stringify(summary, null, 2));
    
    // Clear old metrics to prevent memory leaks
    this.apiMetrics = this.apiMetrics.slice(-1000);
    this.dbMetrics = this.dbMetrics.slice(-1000);
    this.systemMetrics = this.systemMetrics.slice(-100);
    this.userSessionMetrics = this.userSessionMetrics.slice(-1000);
  }

  // Get comprehensive metrics summary
  getMetricsSummary() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Filter recent metrics
    const recentApiMetrics = this.apiMetrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    const recentDbMetrics = this.dbMetrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    
    // Calculate API endpoint performance
    const endpointStats = this.calculateEndpointStats(recentApiMetrics);
    
    // Calculate database performance
    const dbStats = this.calculateDatabaseStats(recentDbMetrics);
    
    return {
      timestamp: new Date().toISOString(),
      uptime: now - this.stats.uptime,
      overview: {
        totalRequests: this.stats.totalRequests,
        errorRate: this.stats.totalRequests > 0 ? (this.stats.errorRequests / this.stats.totalRequests) * 100 : 0,
        averageResponseTime: this.stats.averageResponseTime,
        slowRequestRate: this.stats.totalRequests > 0 ? (this.stats.slowRequests / this.stats.totalRequests) * 100 : 0,
        totalDbQueries: this.stats.totalDbQueries,
        slowQueryRate: this.stats.totalDbQueries > 0 ? (this.stats.slowDbQueries / this.stats.totalDbQueries) * 100 : 0,
        peakMemoryUsage: this.stats.peakMemoryUsage
      },
      api: {
        recentRequests: recentApiMetrics.length,
        endpointPerformance: endpointStats
      },
      database: {
        recentQueries: recentDbMetrics.length,
        queryPerformance: dbStats
      },
      system: {
        current: this.systemMetrics.slice(-1)[0] || null,
        trend: this.systemMetrics.slice(-10)
      }
    };
  }

  // Calculate endpoint-specific performance stats
  private calculateEndpointStats(metrics: ApiMetrics[]) {
    const endpointGroups = metrics.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, ApiMetrics[]>);

    return Object.entries(endpointGroups).map(([endpoint, metrics]) => {
      const responseTimes = metrics.map(m => m.responseTime);
      const errorCount = metrics.filter(m => m.statusCode >= 400).length;
      
      return {
        endpoint,
        requestCount: metrics.length,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p95ResponseTime: this.calculatePercentile(responseTimes, 0.95),
        errorRate: (errorCount / metrics.length) * 100,
        slowRequestCount: metrics.filter(m => m.responseTime > this.config.slowApiThreshold).length
      };
    }).sort((a, b) => b.requestCount - a.requestCount);
  }

  // Calculate database performance stats
  private calculateDatabaseStats(metrics: DatabaseMetrics[]) {
    const queryGroups = metrics.reduce((acc, metric) => {
      const key = `${metric.queryType}_${metric.tableName || 'unknown'}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, DatabaseMetrics[]>);

    return Object.entries(queryGroups).map(([query, metrics]) => {
      const durations = metrics.map(m => m.duration);
      const errorCount = metrics.filter(m => !m.success).length;
      
      return {
        query,
        queryCount: metrics.length,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        p95Duration: this.calculatePercentile(durations, 0.95),
        errorRate: (errorCount / metrics.length) * 100,
        slowQueryCount: metrics.filter(m => m.duration > this.config.slowQueryThreshold).length
      };
    }).sort((a, b) => b.queryCount - a.queryCount);
  }

  // Utility functions
  private normalizeEndpoint(path: string): string {
    // Normalize endpoints to group similar paths
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
      .replace(/\/[a-f0-9]{24}/g, '/:objectId');
  }

  private normalizeQueryType(query: string): DatabaseMetrics['queryType'] {
    const upper = query.toUpperCase();
    if (upper.includes('SELECT')) return 'SELECT';
    if (upper.includes('INSERT')) return 'INSERT';
    if (upper.includes('UPDATE')) return 'UPDATE';
    if (upper.includes('DELETE')) return 'DELETE';
    return 'OTHER';
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index] || 0;
  }

  private trimBuffer<T>(buffer: T[], type: string): void {
    if (buffer.length > this.config.maxMetricsBufferSize) {
      const removed = buffer.length - this.config.maxMetricsBufferSize;
      buffer.splice(0, removed);
      console.warn(`📊 APM: Trimmed ${removed} ${type} metrics to prevent memory overflow`);
    }
  }

  // Public API for getting current metrics
  getCurrentMetrics() {
    return {
      api: this.apiMetrics.slice(-100),
      database: this.dbMetrics.slice(-100),
      system: this.systemMetrics.slice(-10),
      userSession: this.userSessionMetrics.slice(-100),
      stats: this.stats
    };
  }

  // Cleanup method
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    console.log('🚀 APM Service destroyed');
  }
}

// Global APM instance
export const apmService = new APMService();

// Database query wrapper for automatic performance tracking
export function trackDatabaseQuery<T>(
  queryFn: () => Promise<T>,
  queryType: string,
  tableName?: string
): Promise<T> {
  const startTime = performance.now();
  
  return queryFn()
    .then(result => {
      const duration = performance.now() - startTime;
      apmService.recordDatabaseMetric(queryType, duration, true, tableName);
      return result;
    })
    .catch(error => {
      const duration = performance.now() - startTime;
      apmService.recordDatabaseMetric(queryType, duration, false, tableName, error.message);
      throw error;
    });
}

// User session tracking helper
export function trackUserSession(
  userId: string,
  sessionId: string,
  action: string,
  metadata?: Record<string, any>
) {
  return {
    start: () => {
      const startTime = performance.now();
      return {
        end: (success: boolean = true) => {
          const duration = performance.now() - startTime;
          apmService.recordUserSessionMetric(userId, sessionId, action, success, duration, metadata);
        }
      };
    },
    record: (success: boolean = true, duration?: number) => {
      apmService.recordUserSessionMetric(userId, sessionId, action, success, duration, metadata);
    }
  };
}

export default apmService;