// 🚀 PERFORMANCE: Utility functions for performance optimization
import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';

// Performance monitoring and measurement utilities
export class PerformanceTracker {
  private static marks: Map<string, number> = new Map();
  private static measures: Map<string, number> = new Map();

  // Mark the start of a performance measurement
  static mark(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
      this.marks.set(name, performance.now());
    }
  }

  // Measure and log performance
  static measure(name: string, logToConsole = false): number {
    if (typeof performance === 'undefined') return 0;
    
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    this.measures.set(name, duration);
    
    if (logToConsole || process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  // Get all measurements
  static getMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  // Clear all measurements
  static clear(): void {
    this.marks.clear();
    this.measures.clear();
    if (typeof performance !== 'undefined') {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function throttledFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy loading utilities
export function createLazyComponent<T>(
  loader: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  return React.lazy(async () => {
    PerformanceTracker.mark('lazy-component-load');
    const module = await loader();
    PerformanceTracker.measure('lazy-component-load');
    return module;
  });
}

// Image lazy loading with intersection observer
export function useLazyImage(src: string, options: IntersectionObserverInit = {}) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px',
        ...options 
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src, options]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsError(true);
    setIsLoaded(false);
  }, []);

  return {
    imgRef,
    src: imageSrc,
    isLoaded,
    isError,
    onLoad: handleLoad,
    onError: handleError
  };
}

// Memory usage tracking
export function trackMemoryUsage(): {
  used: number;
  total: number;
  percentage: number;
} {
  if (typeof performance === 'undefined' || !('memory' in performance)) {
    return { used: 0, total: 0, percentage: 0 };
  }

  const memory = (performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
  };
}

// Bundle size tracking helper
export function reportBundleSize(componentName: string, size?: number): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Bundle: ${componentName}${size ? ` (${(size / 1024).toFixed(2)}KB)` : ''}`);
  }
}

// Performance budget checker
export interface PerformanceBudget {
  bundleSize: number; // KB
  loadTime: number; // ms
  memoryUsage: number; // MB
}

export const DEFAULT_PERFORMANCE_BUDGET: PerformanceBudget = {
  bundleSize: 500, // 500KB initial bundle
  loadTime: 3000, // 3 seconds
  memoryUsage: 50 // 50MB
};

export function checkPerformanceBudget(
  actual: Partial<PerformanceBudget>,
  budget: PerformanceBudget = DEFAULT_PERFORMANCE_BUDGET
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (actual.bundleSize && actual.bundleSize > budget.bundleSize) {
    violations.push(`Bundle size exceeded: ${actual.bundleSize}KB > ${budget.bundleSize}KB`);
  }

  if (actual.loadTime && actual.loadTime > budget.loadTime) {
    violations.push(`Load time exceeded: ${actual.loadTime}ms > ${budget.loadTime}ms`);
  }

  if (actual.memoryUsage && actual.memoryUsage > budget.memoryUsage) {
    violations.push(`Memory usage exceeded: ${actual.memoryUsage}MB > ${budget.memoryUsage}MB`);
  }

  return {
    passed: violations.length === 0,
    violations
  };
}