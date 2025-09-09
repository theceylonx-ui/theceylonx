import { Request, Response } from 'express';
import { db } from '../db';
import { envConfig } from '../config/environment';
import { cache } from '../cache/cacheService';

// 🚀 PHASE 4: Production health check system
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthStatus;
    cache: HealthStatus;
    memory: HealthStatus;
    disk?: HealthStatus;
  };
}

interface HealthStatus {
  status: 'pass' | 'fail' | 'warn';
  responseTime?: number;
  details?: any;
}

// Database health check
async function checkDatabase(): Promise<HealthStatus> {
  try {
    const start = Date.now();
    await db.execute('SELECT 1');
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime < 1000 ? 'pass' : 'warn',
      responseTime,
      details: responseTime > 1000 ? 'Slow database response' : undefined,
    };
  } catch (error) {
    return {
      status: 'fail',
      details: 'Database connection failed',
    };
  }
}

// Cache health check
function checkCache(): HealthStatus {
  try {
    const stats = cache.getStats();
    
    return {
      status: 'pass',
      details: {
        hitRate: stats.hitRate,
        size: stats.size,
        hits: stats.hits,
        misses: stats.misses,
      },
    };
  } catch (error) {
    return {
      status: 'fail',
      details: 'Cache system error',
    };
  }
}

// Memory health check
function checkMemory(): HealthStatus {
  try {
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    const memLimitMB = (memUsage.heapTotal / 1024 / 1024) * 0.9; // 90% threshold
    
    return {
      status: memUsageMB < memLimitMB ? 'pass' : 'warn',
      details: {
        heapUsed: `${Math.round(memUsageMB)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      },
    };
  } catch (error) {
    return {
      status: 'fail',
      details: 'Memory check failed',
    };
  }
}

// Main health check endpoint
export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    const [dbHealth, cacheHealth, memoryHealth] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkCache()),
      Promise.resolve(checkMemory()),
    ]);
    
    const overallStatus = 
      [dbHealth, cacheHealth, memoryHealth].every(check => check.status === 'pass') ? 'healthy' :
      [dbHealth, cacheHealth, memoryHealth].some(check => check.status === 'fail') ? 'unhealthy' : 
      'degraded';
    
    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbHealth,
        cache: cacheHealth,
        memory: memoryHealth,
      },
    };
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    res.status(statusCode).json(result);
    
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
    });
  }
}

// Readiness check (for Kubernetes/container orchestration)
export async function readinessCheck(req: Request, res: Response) {
  try {
    // Check if essential services are ready
    const dbHealth = await checkDatabase();
    
    if (dbHealth.status === 'fail') {
      return res.status(503).json({
        status: 'not_ready',
        reason: 'Database not available',
      });
    }
    
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      reason: 'Service initialization failed',
    });
  }
}

// Liveness check (for Kubernetes/container orchestration)
export function livenessCheck(req: Request, res: Response) {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}