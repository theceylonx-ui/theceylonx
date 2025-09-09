import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 🚀 PHASE 3 PERFORMANCE: Client-side performance monitoring
interface PerformanceMetrics {
  loadTime: number;
  cacheHitRate: number;
  networkRequests: number;
  memoryUsage: number;
  renderTime: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    cacheHitRate: 0,
    networkRequests: 0,
    memoryUsage: 0,
    renderTime: 0,
  });

  // Monitor cache performance from server
  const { data: cacheStats } = useQuery({
    queryKey: ['/api/performance/cache-stats'] as const,
    refetchInterval: 60000, // Check every minute
    staleTime: 30000, // 30 seconds
  });

  useEffect(() => {
    // Measure initial load time
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }

    // Monitor ongoing performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration,
          }));
        }
      });
    });

    observer.observe({ entryTypes: ['measure', 'navigation'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Update cache hit rate from server stats
    if (cacheStats) {
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: (cacheStats as any).hitRatePercent || 0,
      }));
    }
  }, [cacheStats]);

  // Memory usage monitoring
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        }));
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    cacheStats,
    getPerformanceScore: () => {
      const score = {
        loadTime: metrics.loadTime < 3000 ? 'excellent' : metrics.loadTime < 5000 ? 'good' : 'poor',
        cache: metrics.cacheHitRate > 70 ? 'excellent' : metrics.cacheHitRate > 50 ? 'good' : 'poor',
        memory: metrics.memoryUsage < 50 ? 'excellent' : metrics.memoryUsage < 100 ? 'good' : 'poor',
      };
      return score;
    }
  };
};