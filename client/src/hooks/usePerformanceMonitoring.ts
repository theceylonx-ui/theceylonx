// 🚀 PERFORMANCE: Comprehensive performance monitoring hooks
import { useState, useEffect, useCallback, useRef } from 'react';

// Performance metrics interface
interface PerformanceMetrics {
  // Page load metrics
  loadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  largestContentfulPaint?: number;
  
  // Resource metrics
  totalResources: number;
  resourceLoadTime: number;
  
  // User interaction metrics
  timeToInteractive?: number;
  clickResponseTime: number[];
  
  // Memory metrics
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  
  // Network metrics
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// Performance budget configuration
interface PerformanceBudget {
  loadTime: number; // Max page load time in ms
  firstContentfulPaint: number; // Max FCP in ms
  largestContentfulPaint: number; // Max LCP in ms
  cumulativeLayoutShift: number; // Max CLS score
  firstInputDelay: number; // Max FID in ms
  resourceCount: number; // Max number of resources
  bundleSize: number; // Max bundle size in bytes
}

const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  loadTime: 3000, // 3 seconds
  firstContentfulPaint: 1500, // 1.5 seconds
  largestContentfulPaint: 2500, // 2.5 seconds
  cumulativeLayoutShift: 0.1, // Low layout shift
  firstInputDelay: 100, // 100ms
  resourceCount: 50, // 50 resources max
  bundleSize: 500 * 1024, // 500KB
};

// Main performance monitoring hook
export function usePerformanceMonitoring(budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const clickTimes = useRef<number[]>([]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // Wait for page to fully load before collecting metrics
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }
    
    // Monitor clicks for responsiveness
    document.addEventListener('click', trackClickResponse);
    
    return () => {
      window.removeEventListener('load', collectMetrics);
      document.removeEventListener('click', trackClickResponse);
    };
  }, []);

  const collectMetrics = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource');
    
    // Basic load metrics
    const loadTime = navigation.loadEventEnd - navigation.navigationStart;
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
    
    // Paint metrics
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
    const firstContentfulPaint = fcp ? fcp.startTime : 0;
    
    // Resource metrics
    const totalResources = resources.length;
    const resourceLoadTime = resources.reduce((total, resource) => {
      return total + (resource.responseEnd - resource.startTime);
    }, 0) / resources.length;

    // Memory metrics (if available)
    let memoryUsage;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }

    // Network metrics (if available)
    let connectionType, effectiveType, downlink, rtt;
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connectionType = connection.type;
      effectiveType = connection.effectiveType;
      downlink = connection.downlink;
      rtt = connection.rtt;
    }

    const newMetrics: PerformanceMetrics = {
      loadTime,
      domContentLoaded,
      firstContentfulPaint,
      totalResources,
      resourceLoadTime,
      clickResponseTime: [...clickTimes.current],
      memoryUsage,
      connectionType,
      effectiveType,
      downlink,
      rtt
    };

    // Collect Web Vitals if available
    collectWebVitals(newMetrics);

    setMetrics(newMetrics);
    checkPerformanceBudget(newMetrics, budget);
  }, [budget]);

  const collectWebVitals = useCallback((metrics: PerformanceMetrics) => {
    // First Input Delay (FID)
    if ('PerformanceEventTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-input') {
            metrics.firstInputDelay = entry.processingStart - entry.startTime;
          }
        }
      });
      observer.observe({ type: 'first-input', buffered: true });
    }

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.largestContentfulPaint = lastEntry.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        metrics.cumulativeLayoutShift = clsValue;
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    }
  }, []);

  const trackClickResponse = useCallback((event: Event) => {
    const startTime = performance.now();
    
    // Use requestAnimationFrame to measure time to visual update
    requestAnimationFrame(() => {
      const responseTime = performance.now() - startTime;
      clickTimes.current.push(responseTime);
      
      // Keep only last 10 click times
      if (clickTimes.current.length > 10) {
        clickTimes.current.shift();
      }
    });
  }, []);

  const checkPerformanceBudget = useCallback((metrics: PerformanceMetrics, budget: PerformanceBudget) => {
    const newViolations: string[] = [];

    if (metrics.loadTime > budget.loadTime) {
      newViolations.push(`Load time ${metrics.loadTime}ms exceeds budget of ${budget.loadTime}ms`);
    }

    if (metrics.firstContentfulPaint > budget.firstContentfulPaint) {
      newViolations.push(`FCP ${metrics.firstContentfulPaint}ms exceeds budget of ${budget.firstContentfulPaint}ms`);
    }

    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > budget.largestContentfulPaint) {
      newViolations.push(`LCP ${metrics.largestContentfulPaint}ms exceeds budget of ${budget.largestContentfulPaint}ms`);
    }

    if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > budget.cumulativeLayoutShift) {
      newViolations.push(`CLS ${metrics.cumulativeLayoutShift} exceeds budget of ${budget.cumulativeLayoutShift}`);
    }

    if (metrics.firstInputDelay && metrics.firstInputDelay > budget.firstInputDelay) {
      newViolations.push(`FID ${metrics.firstInputDelay}ms exceeds budget of ${budget.firstInputDelay}ms`);
    }

    if (metrics.totalResources > budget.resourceCount) {
      newViolations.push(`Resource count ${metrics.totalResources} exceeds budget of ${budget.resourceCount}`);
    }

    setViolations(newViolations);

    // Log violations in development
    if (process.env.NODE_ENV === 'development' && newViolations.length > 0) {
      console.warn('🚨 Performance Budget Violations:', newViolations);
    }
  }, []);

  const getPerformanceScore = useCallback((): number => {
    if (!metrics) return 0;

    let score = 100;
    const violations = checkBudgetViolations(metrics, budget);
    
    // Deduct points for each violation
    score -= violations.length * 10;
    
    // Additional scoring based on specific metrics
    if (metrics.firstContentfulPaint > 1000) score -= 10;
    if (metrics.loadTime > 2000) score -= 20;
    if (metrics.largestContentfulPaint && metrics.largestContentfulPaint > 2500) score -= 15;
    
    return Math.max(0, score);
  }, [metrics, budget]);

  const checkBudgetViolations = useCallback((metrics: PerformanceMetrics, budget: PerformanceBudget): string[] => {
    const violations: string[] = [];
    
    Object.entries(budget).forEach(([key, budgetValue]) => {
      const metricValue = (metrics as any)[key];
      if (metricValue && metricValue > budgetValue) {
        violations.push(key);
      }
    });
    
    return violations;
  }, []);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return {
    metrics,
    violations,
    isMonitoring,
    performanceScore: getPerformanceScore(),
    startMonitoring,
    collectMetrics
  };
}

// Hook for monitoring React component performance
export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef<number>(0);
  const totalRenderTime = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    lastRenderTime.current = startTime;
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      totalRenderTime.current += renderTime;
      renderCount.current += 1;
      
      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) { // >16ms is slow
        console.warn(`🐌 Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
      }
    };
  });

  const getAverageRenderTime = useCallback(() => {
    return renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0;
  }, []);

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    averageRenderTime: getAverageRenderTime(),
    totalRenderTime: totalRenderTime.current
  };
}

// Hook for monitoring bundle size and resource loading
export function useResourceMonitoring() {
  const [resourceMetrics, setResourceMetrics] = useState<{
    jsSize: number;
    cssSize: number;
    imageSize: number;
    totalSize: number;
    resourceCount: number;
  } | null>(null);

  const collectResourceMetrics = useCallback(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;
    let totalSize = 0;
    
    resources.forEach(resource => {
      const transferSize = resource.transferSize || 0;
      totalSize += transferSize;
      
      if (resource.name.includes('.js')) {
        jsSize += transferSize;
      } else if (resource.name.includes('.css')) {
        cssSize += transferSize;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        imageSize += transferSize;
      }
    });

    setResourceMetrics({
      jsSize,
      cssSize,
      imageSize,
      totalSize,
      resourceCount: resources.length
    });
  }, []);

  useEffect(() => {
    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectResourceMetrics();
    } else {
      window.addEventListener('load', collectResourceMetrics);
      return () => window.removeEventListener('load', collectResourceMetrics);
    }
  }, [collectResourceMetrics]);

  return {
    resourceMetrics,
    collectResourceMetrics
  };
}