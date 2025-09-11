// Performance optimization utilities for mobile and web

/**
 * Image optimization and lazy loading utilities
 */
export class ImageOptimizer {
  private static observer: IntersectionObserver | null = null;
  private static isSupported = typeof window !== 'undefined' && 'IntersectionObserver' in window;

  /**
   * Initialize lazy loading observer
   */
  static initLazyLoading() {
    if (!this.isSupported) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }

  /**
   * Add image to lazy loading queue
   */
  static lazyLoad(img: HTMLImageElement) {
    if (!this.observer) {
      this.initLazyLoading();
    }

    if (this.observer && this.isSupported) {
      this.observer.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  /**
   * Load image with error handling
   */
  private static loadImage(img: HTMLImageElement) {
    const src = img.dataset.src;
    if (!src) return;

    img.onload = () => {
      img.classList.add('loaded');
      img.removeAttribute('data-src');
    };

    img.onerror = () => {
      img.classList.add('error');
      // Set fallback image
      const fallback = img.dataset.fallback || '/assets/placeholder.png';
      img.src = fallback;
    };

    img.src = src;
  }

  /**
   * Generate responsive image sources
   */
  static generateSources(baseUrl: string, sizes: number[] = [320, 640, 1024, 1280, 1920]) {
    return sizes.map(size => ({
      size,
      url: `${baseUrl}?w=${size}&q=80&f=webp`,
      media: `(max-width: ${size}px)`
    }));
  }

  /**
   * Preload critical images
   */
  static preloadCritical(urls: string[]) {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }
}

/**
 * Network-aware performance optimizations
 */
export class NetworkOptimizer {
  private static connection: any = null;
  
  static {
    if (typeof navigator !== 'undefined') {
      this.connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    }
  }

  /**
   * Get network information
   */
  static getNetworkInfo() {
    if (!this.connection) {
      return {
        type: 'unknown',
        effectiveType: '4g',
        downlink: Infinity,
        rtt: 0,
        saveData: false
      };
    }

    return {
      type: this.connection.type || 'unknown',
      effectiveType: this.connection.effectiveType || '4g',
      downlink: this.connection.downlink || Infinity,
      rtt: this.connection.rtt || 0,
      saveData: this.connection.saveData || false
    };
  }

  /**
   * Check if connection is slow
   */
  static isSlowConnection() {
    const { effectiveType, saveData } = this.getNetworkInfo();
    return saveData || effectiveType === 'slow-2g' || effectiveType === '2g';
  }

  /**
   * Adapt content based on network conditions
   */
  static adaptToNetwork() {
    const isSlow = this.isSlowConnection();
    
    return {
      shouldPreload: !isSlow,
      shouldLazyLoad: isSlow,
      imageQuality: isSlow ? 60 : 80,
      shouldAutoplay: !isSlow,
      shouldLoadFonts: !isSlow,
      shouldLoadAnalytics: !isSlow
    };
  }
}

/**
 * Bundle and resource optimization
 */
export class ResourceOptimizer {
  private static loadedChunks = new Set<string>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * Dynamically import with caching
   */
  static async importModule<T>(importFn: () => Promise<T>, chunkId: string): Promise<T> {
    if (this.loadedChunks.has(chunkId)) {
      return importFn();
    }

    if (this.loadingPromises.has(chunkId)) {
      return this.loadingPromises.get(chunkId)!;
    }

    const promise = importFn().then((module) => {
      this.loadedChunks.add(chunkId);
      this.loadingPromises.delete(chunkId);
      return module;
    });

    this.loadingPromises.set(chunkId, promise);
    return promise;
  }

  /**
   * Preload critical resources
   */
  static preloadResources(resources: Array<{ href: string; as: string; type?: string }>) {
    resources.forEach(({ href, as, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      document.head.appendChild(link);
    });
  }

  /**
   * Defer non-critical CSS
   */
  static deferCSS(href: string) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = function() {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
  }

  /**
   * Critical CSS inlining
   */
  static inlineCriticalCSS(css: string) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}

/**
 * Memory and performance monitoring
 */
export class PerformanceMonitor {
  private static metrics: Record<string, number> = {};
  private static observers: PerformanceObserver[] = [];

  /**
   * Initialize performance monitoring
   */
  static init() {
    if (typeof window === 'undefined') return;

    this.monitorWebVitals();
    this.monitorLongTasks();
    this.monitorMemoryUsage();
  }

  /**
   * Monitor Core Web Vitals
   */
  private static monitorWebVitals() {
    try {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  /**
   * Monitor long tasks that block the main thread
   */
  private static monitorLongTasks() {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          console.warn(`Long task detected: ${entry.duration}ms`, entry);
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (error) {
      console.warn('Long task monitoring not available:', error);
    }
  }

  /**
   * Monitor memory usage
   */
  private static monitorMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsed = memory.usedJSHeapSize;
      this.metrics.memoryTotal = memory.totalJSHeapSize;
      this.metrics.memoryLimit = memory.jsHeapSizeLimit;
    }
  }

  /**
   * Get current metrics
   */
  static getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Log performance report
   */
  static logReport() {
    const metrics = this.getMetrics();
    console.group('🚀 Performance Report');
    console.log('First Contentful Paint:', metrics.fcp?.toFixed(2) + 'ms');
    console.log('Largest Contentful Paint:', metrics.lcp?.toFixed(2) + 'ms');
    console.log('Cumulative Layout Shift:', metrics.cls?.toFixed(4));
    if (metrics.memoryUsed) {
      console.log('Memory Used:', (metrics.memoryUsed / 1024 / 1024).toFixed(2) + 'MB');
    }
    console.groupEnd();
  }

  /**
   * Cleanup observers
   */
  static cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Cache optimization utilities
 */
export class CacheOptimizer {
  private static cacheName = 'ceylon-expand-cache-v1';
  private static isSupported = 'caches' in window;

  /**
   * Cache critical resources
   */
  static async cacheResources(urls: string[]) {
    if (!this.isSupported) return;

    try {
      const cache = await caches.open(this.cacheName);
      await cache.addAll(urls);
    } catch (error) {
      console.warn('Failed to cache resources:', error);
    }
  }

  /**
   * Get cached response
   */
  static async getCached(url: string): Promise<Response | undefined> {
    if (!this.isSupported) return;

    try {
      const cache = await caches.open(this.cacheName);
      return await cache.match(url);
    } catch (error) {
      console.warn('Failed to get cached resource:', error);
    }
  }

  /**
   * Clear old caches
   */
  static async clearOldCaches() {
    if (!this.isSupported) return;

    try {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => name !== this.cacheName);
      await Promise.all(oldCaches.map(name => caches.delete(name)));
    } catch (error) {
      console.warn('Failed to clear old caches:', error);
    }
  }
}

/**
 * Initialize all performance optimizations
 */
export function initPerformanceOptimizations() {
  // Initialize lazy loading
  ImageOptimizer.initLazyLoading();
  
  // Start performance monitoring
  PerformanceMonitor.init();
  
  // Adapt to network conditions
  const networkAdaptations = NetworkOptimizer.adaptToNetwork();
  
  // Apply network-based optimizations
  if (networkAdaptations.shouldLoadFonts) {
    // Load web fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  
  // Log performance report after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      PerformanceMonitor.logReport();
    }, 2000);
  });
  
  // Clear old caches on app start
  CacheOptimizer.clearOldCaches();
  
  return networkAdaptations;
}