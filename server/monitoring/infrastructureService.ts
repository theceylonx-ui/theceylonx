// 🚀 INFRASTRUCTURE MONITORING - System resource and performance monitoring
import os from 'os';
import { promises as fs } from 'fs';
import { cache } from '../cache/cacheService';

// Resource utilization interfaces
interface CPUMetrics {
  usage: number; // Percentage
  loadAverage: {
    oneMinute: number;
    fiveMinute: number;
    fifteenMinute: number;
  };
  cores: number;
  model: string;
  speed: number; // MHz
}

interface MemoryMetrics {
  total: number; // bytes
  used: number;
  free: number;
  cached?: number;
  buffers?: number;
  percentage: number;
  heap: {
    used: number;
    total: number;
    percentage: number;
  };
  external: number;
  rss: number; // Resident Set Size
}

interface DiskMetrics {
  total: number; // bytes
  used: number;
  free: number;
  percentage: number;
  inodes?: {
    total: number;
    used: number;
    percentage: number;
  };
}

interface NetworkMetrics {
  connections: {
    established: number;
    listening: number;
    timeWait: number;
    total: number;
  };
  bandwidth?: {
    bytesReceived: number;
    bytesSent: number;
  };
  latency?: {
    internal: number; // ms
    external: number; // ms to external service
  };
}

interface CacheMetrics {
  hitRate: number;
  size: number;
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  memoryUsage: number; // bytes
  efficiency: 'excellent' | 'good' | 'poor';
}

interface DatabaseMetrics {
  connectionPool?: {
    active: number;
    idle: number;
    total: number;
    waiting: number;
  };
  queryPerformance: {
    averageResponseTime: number;
    slowQueries: number;
    failedQueries: number;
    totalQueries: number;
  };
  replicationLag?: number; // ms
}

interface ProcessMetrics {
  pid: number;
  uptime: number; // seconds
  version: string;
  platform: string;
  arch: string;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  eventLoopDelay?: number; // ms
  gcStats?: {
    collections: number;
    pauseTime: number; // ms
  };
}

// Alert thresholds
interface InfrastructureThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  cache: { hitRateWarning: number };
  database: { slowQueryThreshold: number; errorRateThreshold: number };
  network: { latencyWarning: number; latencyCritical: number };
}

// Complete infrastructure snapshot
interface InfrastructureSnapshot {
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  cache: CacheMetrics;
  database: DatabaseMetrics;
  process: ProcessMetrics;
  health: {
    overall: 'healthy' | 'degraded' | 'critical';
    issues: string[];
    warnings: string[];
  };
}

class InfrastructureMonitoringService {
  private metrics: InfrastructureSnapshot[] = [];
  private alertCallbacks: ((alert: InfrastructureAlert) => void)[] = [];
  private thresholds: InfrastructureThresholds;
  private monitoringInterval?: NodeJS.Timeout;
  private eventLoopMonitor?: NodeJS.Timeout;
  
  // Tracking variables
  private eventLoopDelayHistory: number[] = [];
  private lastCpuUsage?: NodeJS.CpuUsage;
  private queryStats = {
    total: 0,
    slow: 0,
    failed: 0,
    totalTime: 0
  };

  constructor(thresholds: Partial<InfrastructureThresholds> = {}) {
    this.thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 80, critical: 95 },
      cache: { hitRateWarning: 0.7 },
      database: { slowQueryThreshold: 1000, errorRateThreshold: 0.05 },
      network: { latencyWarning: 500, latencyCritical: 2000 },
      ...thresholds
    };

    this.startMonitoring();
    this.startEventLoopMonitoring();
    console.log('📊 Infrastructure Monitoring Service initialized');
  }

  // Start continuous monitoring
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const snapshot = await this.collectSnapshot();
        this.metrics.push(snapshot);
        
        // Keep only last 1000 snapshots (adjust based on collection frequency)
        if (this.metrics.length > 1000) {
          this.metrics = this.metrics.slice(-1000);
        }
        
        // Check thresholds and send alerts
        this.checkThresholds(snapshot);
        
      } catch (error) {
        console.error('Error collecting infrastructure metrics:', error);
      }
    }, 30000); // Collect every 30 seconds
  }

  // Event loop delay monitoring (critical for Node.js performance)
  private startEventLoopMonitoring(): void {
    let start = process.hrtime.bigint();
    
    this.eventLoopMonitor = setInterval(() => {
      const delta = process.hrtime.bigint() - start;
      const delay = Number(delta - BigInt(1000000000)) / 1000000; // Convert to ms
      
      this.eventLoopDelayHistory.push(delay);
      if (this.eventLoopDelayHistory.length > 100) {
        this.eventLoopDelayHistory = this.eventLoopDelayHistory.slice(-100);
      }
      
      start = process.hrtime.bigint();
    }, 1000); // Check every second
  }

  // Collect comprehensive infrastructure snapshot
  private async collectSnapshot(): Promise<InfrastructureSnapshot> {
    const [cpu, memory, disk, network, cacheMetrics, dbMetrics, processMetrics] = await Promise.all([
      this.collectCPUMetrics(),
      this.collectMemoryMetrics(),
      this.collectDiskMetrics(),
      this.collectNetworkMetrics(),
      this.collectCacheMetrics(),
      this.collectDatabaseMetrics(),
      this.collectProcessMetrics()
    ]);

    const health = this.assessHealth(cpu, memory, disk, network, cacheMetrics, dbMetrics);

    return {
      timestamp: new Date(),
      cpu,
      memory,
      disk,
      network,
      cache: cacheMetrics,
      database: dbMetrics,
      process: processMetrics,
      health
    };
  }

  // CPU metrics collection
  private async collectCPUMetrics(): Promise<CPUMetrics> {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // Calculate CPU usage percentage
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    this.lastCpuUsage = process.cpuUsage();
    
    const cpuPercent = currentUsage.user + currentUsage.system;
    const usage = (cpuPercent / 1000000) / cpus.length * 100; // Convert to percentage

    return {
      usage: Math.min(100, Math.max(0, usage)),
      loadAverage: {
        oneMinute: loadAvg[0],
        fiveMinute: loadAvg[1],
        fifteenMinute: loadAvg[2]
      },
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0
    };
  }

  // Memory metrics collection
  private async collectMemoryMetrics(): Promise<MemoryMetrics> {
    const systemTotal = os.totalmem();
    const systemFree = os.freemem();
    const systemUsed = systemTotal - systemFree;
    
    const processMemory = process.memoryUsage();
    
    return {
      total: systemTotal,
      used: systemUsed,
      free: systemFree,
      percentage: (systemUsed / systemTotal) * 100,
      heap: {
        used: processMemory.heapUsed,
        total: processMemory.heapTotal,
        percentage: (processMemory.heapUsed / processMemory.heapTotal) * 100
      },
      external: processMemory.external,
      rss: processMemory.rss
    };
  }

  // Disk metrics collection
  private async collectDiskMetrics(): Promise<DiskMetrics> {
    try {
      // For Replit environment, use estimated values
      // In a real production environment, you'd use statvfs or similar
      const total = 10 * 1024 * 1024 * 1024; // 10GB estimate
      const used = 2 * 1024 * 1024 * 1024;   // 2GB estimate
      const free = total - used;
      
      return {
        total,
        used,
        free,
        percentage: (used / total) * 100
      };
    } catch (error) {
      return {
        total: 1,
        used: 0,
        free: 1,
        percentage: 0
      };
    }
  }

  // Network metrics collection
  private async collectNetworkMetrics(): Promise<NetworkMetrics> {
    // In production, you'd use netstat or similar tools
    // For now, provide estimated metrics
    return {
      connections: {
        established: 10,
        listening: 3,
        timeWait: 2,
        total: 15
      },
      latency: {
        internal: await this.measureInternalLatency(),
        external: await this.measureExternalLatency()
      }
    };
  }

  // Cache metrics collection
  private collectCacheMetrics(): CacheMetrics {
    const stats = cache.getStats();
    
    // Estimate memory usage (in production, use actual cache memory usage)
    const estimatedMemoryUsage = stats.size * 1024; // Rough estimate
    
    let efficiency: CacheMetrics['efficiency'];
    if (stats.hitRate > 0.8) efficiency = 'excellent';
    else if (stats.hitRate > 0.5) efficiency = 'good';
    else efficiency = 'poor';

    return {
      hitRate: stats.hitRate,
      size: stats.size,
      hits: stats.hits,
      misses: stats.misses,
      sets: stats.sets,
      deletes: stats.deletes,
      memoryUsage: estimatedMemoryUsage,
      efficiency
    };
  }

  // Database metrics collection
  private collectDatabaseMetrics(): DatabaseMetrics {
    const avgResponseTime = this.queryStats.total > 0 ? 
      this.queryStats.totalTime / this.queryStats.total : 0;
    
    return {
      queryPerformance: {
        averageResponseTime: avgResponseTime,
        slowQueries: this.queryStats.slow,
        failedQueries: this.queryStats.failed,
        totalQueries: this.queryStats.total
      }
    };
  }

  // Process metrics collection
  private collectProcessMetrics(): ProcessMetrics {
    const averageEventLoopDelay = this.eventLoopDelayHistory.length > 0 ?
      this.eventLoopDelayHistory.reduce((a, b) => a + b, 0) / this.eventLoopDelayHistory.length : 0;

    return {
      pid: process.pid,
      uptime: process.uptime(),
      version: process.version,
      platform: os.platform(),
      arch: os.arch(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      eventLoopDelay: averageEventLoopDelay
    };
  }

  // Health assessment
  private assessHealth(
    cpu: CPUMetrics,
    memory: MemoryMetrics,
    disk: DiskMetrics,
    network: NetworkMetrics,
    cache: CacheMetrics,
    database: DatabaseMetrics
  ): InfrastructureSnapshot['health'] {
    const issues: string[] = [];
    const warnings: string[] = [];

    // CPU health
    if (cpu.usage > this.thresholds.cpu.critical) {
      issues.push(`Critical CPU usage: ${cpu.usage.toFixed(1)}%`);
    } else if (cpu.usage > this.thresholds.cpu.warning) {
      warnings.push(`High CPU usage: ${cpu.usage.toFixed(1)}%`);
    }

    // Memory health
    if (memory.percentage > this.thresholds.memory.critical) {
      issues.push(`Critical memory usage: ${memory.percentage.toFixed(1)}%`);
    } else if (memory.percentage > this.thresholds.memory.warning) {
      warnings.push(`High memory usage: ${memory.percentage.toFixed(1)}%`);
    }

    // Disk health
    if (disk.percentage > this.thresholds.disk.critical) {
      issues.push(`Critical disk usage: ${disk.percentage.toFixed(1)}%`);
    } else if (disk.percentage > this.thresholds.disk.warning) {
      warnings.push(`High disk usage: ${disk.percentage.toFixed(1)}%`);
    }

    // Cache health
    if (cache.hitRate < this.thresholds.cache.hitRateWarning) {
      warnings.push(`Low cache hit rate: ${(cache.hitRate * 100).toFixed(1)}%`);
    }

    // Database health
    const errorRate = database.queryPerformance.totalQueries > 0 ?
      database.queryPerformance.failedQueries / database.queryPerformance.totalQueries : 0;
    
    if (errorRate > this.thresholds.database.errorRateThreshold) {
      issues.push(`High database error rate: ${(errorRate * 100).toFixed(1)}%`);
    }

    if (database.queryPerformance.averageResponseTime > this.thresholds.database.slowQueryThreshold) {
      warnings.push(`Slow database queries: ${database.queryPerformance.averageResponseTime.toFixed(1)}ms avg`);
    }

    // Network health
    if (network.latency?.external && network.latency.external > this.thresholds.network.latencyCritical) {
      issues.push(`Critical network latency: ${network.latency.external}ms`);
    } else if (network.latency?.external && network.latency.external > this.thresholds.network.latencyWarning) {
      warnings.push(`High network latency: ${network.latency.external}ms`);
    }

    // Event loop health
    const avgEventLoopDelay = this.eventLoopDelayHistory.length > 0 ?
      this.eventLoopDelayHistory.reduce((a, b) => a + b, 0) / this.eventLoopDelayHistory.length : 0;
    
    if (avgEventLoopDelay > 50) {
      issues.push(`High event loop delay: ${avgEventLoopDelay.toFixed(1)}ms`);
    } else if (avgEventLoopDelay > 20) {
      warnings.push(`Elevated event loop delay: ${avgEventLoopDelay.toFixed(1)}ms`);
    }

    // Overall health determination
    let overall: 'healthy' | 'degraded' | 'critical';
    if (issues.length > 0) {
      overall = 'critical';
    } else if (warnings.length > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return { overall, issues, warnings };
  }

  // Threshold checking and alerting
  private checkThresholds(snapshot: InfrastructureSnapshot): void {
    const { health } = snapshot;
    
    if (health.overall === 'critical') {
      this.sendAlert({
        severity: 'critical',
        type: 'infrastructure',
        message: 'Critical infrastructure issues detected',
        details: health.issues,
        timestamp: snapshot.timestamp,
        snapshot
      });
    } else if (health.overall === 'degraded' && health.warnings.length > 2) {
      this.sendAlert({
        severity: 'warning',
        type: 'infrastructure',
        message: 'Infrastructure performance degraded',
        details: health.warnings,
        timestamp: snapshot.timestamp,
        snapshot
      });
    }
  }

  // Send infrastructure alerts
  private sendAlert(alert: InfrastructureAlert): void {
    console.warn(`🚨 Infrastructure Alert [${alert.severity.toUpperCase()}]:`, alert.message);
    console.warn('Details:', alert.details);
    
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  // Network latency measurements
  private async measureInternalLatency(): Promise<number> {
    const start = performance.now();
    // Simulate internal operation
    await new Promise(resolve => setImmediate(resolve));
    return performance.now() - start;
  }

  private async measureExternalLatency(): Promise<number> {
    try {
      const start = performance.now();
      // In production, ping external service
      await new Promise(resolve => setTimeout(resolve, 10));
      return performance.now() - start;
    } catch (error) {
      return 999; // Return high latency on error
    }
  }

  // Database query tracking
  recordDatabaseQuery(duration: number, success: boolean): void {
    this.queryStats.total++;
    this.queryStats.totalTime += duration;
    
    if (duration > this.thresholds.database.slowQueryThreshold) {
      this.queryStats.slow++;
    }
    
    if (!success) {
      this.queryStats.failed++;
    }
  }

  // Public API methods
  getCurrentSnapshot(): InfrastructureSnapshot | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  getMetricsHistory(hours: number = 1): InfrastructureSnapshot[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getResourceTrends(hours: number = 24) {
    const history = this.getMetricsHistory(hours);
    
    if (history.length === 0) return null;

    const latest = history[history.length - 1];
    const earliest = history[0];
    
    return {
      timeRange: { start: earliest.timestamp, end: latest.timestamp },
      cpu: {
        current: latest.cpu.usage,
        average: history.reduce((sum, m) => sum + m.cpu.usage, 0) / history.length,
        peak: Math.max(...history.map(m => m.cpu.usage)),
        trend: latest.cpu.usage > earliest.cpu.usage ? 'increasing' : 'decreasing'
      },
      memory: {
        current: latest.memory.percentage,
        average: history.reduce((sum, m) => sum + m.memory.percentage, 0) / history.length,
        peak: Math.max(...history.map(m => m.memory.percentage)),
        trend: latest.memory.percentage > earliest.memory.percentage ? 'increasing' : 'decreasing'
      },
      cache: {
        current: latest.cache.hitRate,
        average: history.reduce((sum, m) => sum + m.cache.hitRate, 0) / history.length,
        trend: latest.cache.hitRate > earliest.cache.hitRate ? 'improving' : 'degrading'
      }
    };
  }

  // Alert subscription
  onAlert(callback: (alert: InfrastructureAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  // Cleanup
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.eventLoopMonitor) {
      clearInterval(this.eventLoopMonitor);
    }
    console.log('📊 Infrastructure Monitoring Service destroyed');
  }
}

// Alert interface
interface InfrastructureAlert {
  severity: 'warning' | 'critical';
  type: 'infrastructure';
  message: string;
  details: string[];
  timestamp: Date;
  snapshot: InfrastructureSnapshot;
}

// Global infrastructure monitoring instance
export const infrastructureService = new InfrastructureMonitoringService();

// Export types for use in other modules
export type {
  CPUMetrics,
  MemoryMetrics,
  DiskMetrics,
  NetworkMetrics,
  CacheMetrics,
  DatabaseMetrics,
  ProcessMetrics,
  InfrastructureSnapshot,
  InfrastructureAlert,
  InfrastructureThresholds
};

export default infrastructureService;