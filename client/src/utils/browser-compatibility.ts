// Browser compatibility and progressive enhancement utilities

/**
 * Feature detection utilities
 */
export class FeatureDetector {
  private static features: Record<string, boolean> = {};

  /**
   * Detect browser features
   */
  static detect() {
    if (typeof window === 'undefined') return {};

    this.features = {
      // Storage APIs
      localStorage: this.hasLocalStorage(),
      sessionStorage: this.hasSessionStorage(),
      indexedDB: this.hasIndexedDB(),
      
      // Modern JS features
      es6: this.hasES6Support(),
      modules: this.hasModuleSupport(),
      asyncAwait: this.hasAsyncAwait(),
      
      // Web APIs
      serviceWorker: this.hasServiceWorker(),
      pushNotifications: this.hasPushNotifications(),
      webShare: this.hasWebShare(),
      intersectionObserver: this.hasIntersectionObserver(),
      resizeObserver: this.hasResizeObserver(),
      
      // CSS features
      cssGrid: this.hasCSSGrid(),
      cssFlexbox: this.hasCSSFlexbox(),
      cssVariables: this.hasCSSVariables(),
      cssSupports: this.hasCSSSupports(),
      
      // Touch and pointer events
      touchEvents: this.hasTouchEvents(),
      pointerEvents: this.hasPointerEvents(),
      
      // Network APIs
      networkInformation: this.hasNetworkInformation(),
      
      // Media features
      webp: false, // Will be detected asynchronously
      avif: false, // Will be detected asynchronously
      
      // Performance APIs
      performanceObserver: this.hasPerformanceObserver(),
      
      // Accessibility
      reducedMotion: this.prefersReducedMotion(),
      highContrast: this.prefersHighContrast(),
      darkMode: this.prefersDarkMode(),
    };

    // Async feature detection
    this.detectImageFormats();

    return this.features;
  }

  /**
   * Get detected features
   */
  static getFeatures() {
    if (Object.keys(this.features).length === 0) {
      this.detect();
    }
    return this.features;
  }

  /**
   * Check if a feature is supported
   */
  static isSupported(feature: string): boolean {
    return this.getFeatures()[feature] || false;
  }

  // Storage detection
  private static hasLocalStorage(): boolean {
    try {
      const test = '__test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static hasSessionStorage(): boolean {
    try {
      const test = '__test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  private static hasIndexedDB(): boolean {
    return 'indexedDB' in window;
  }

  // Modern JS features
  private static hasES6Support(): boolean {
    try {
      // Test arrow functions, const/let, template literals
      eval('const test = () => `ES6 ${typeof Symbol}`');
      return typeof Symbol !== 'undefined';
    } catch {
      return false;
    }
  }

  private static hasModuleSupport(): boolean {
    const script = document.createElement('script');
    return 'noModule' in script;
  }

  private static hasAsyncAwait(): boolean {
    try {
      eval('(async () => {})');
      return true;
    } catch {
      return false;
    }
  }

  // Web APIs
  private static hasServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  }

  private static hasPushNotifications(): boolean {
    return 'PushManager' in window && 'Notification' in window;
  }

  private static hasWebShare(): boolean {
    return 'share' in navigator;
  }

  private static hasIntersectionObserver(): boolean {
    return 'IntersectionObserver' in window;
  }

  private static hasResizeObserver(): boolean {
    return 'ResizeObserver' in window;
  }

  // CSS features
  private static hasCSSGrid(): boolean {
    return CSS.supports('display', 'grid');
  }

  private static hasCSSFlexbox(): boolean {
    return CSS.supports('display', 'flex');
  }

  private static hasCSSVariables(): boolean {
    return CSS.supports('color', 'var(--test)');
  }

  private static hasCSSSupports(): boolean {
    return 'CSS' in window && 'supports' in CSS;
  }

  // Touch and pointer events
  private static hasTouchEvents(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private static hasPointerEvents(): boolean {
    return 'PointerEvent' in window;
  }

  // Network APIs
  private static hasNetworkInformation(): boolean {
    return 'connection' in navigator;
  }

  // Performance APIs
  private static hasPerformanceObserver(): boolean {
    return 'PerformanceObserver' in window;
  }

  // Accessibility preferences
  private static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private static prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  private static prefersDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Async image format detection
  private static async detectImageFormats() {
    this.features.webp = await this.canUseImageFormat('webp');
    this.features.avif = await this.canUseImageFormat('avif');
  }

  private static canUseImageFormat(format: string): Promise<boolean> {
    return new Promise((resolve) => {
      const formats: Record<string, string> = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      };

      const img = new Image();
      img.onload = () => resolve(img.width === 1);
      img.onerror = () => resolve(false);
      img.src = formats[format];
    });
  }
}

/**
 * Polyfill management
 */
export class PolyfillManager {
  private static loaded = new Set<string>();

  /**
   * Load polyfills based on feature detection
   */
  static async loadRequired() {
    const features = FeatureDetector.getFeatures();
    const polyfills: string[] = [];

    // Add polyfills based on missing features
    if (!features.intersectionObserver) {
      polyfills.push('intersection-observer');
    }
    
    if (!features.resizeObserver) {
      polyfills.push('resize-observer-polyfill');
    }

    if (!features.es6) {
      polyfills.push('core-js/stable', 'regenerator-runtime/runtime');
    }

    if (!features.webShare) {
      polyfills.push('web-share-polyfill');
    }

    // Load polyfills
    await this.loadPolyfills(polyfills);
  }

  /**
   * Load specific polyfills
   */
  private static async loadPolyfills(polyfills: string[]) {
    for (const polyfill of polyfills) {
      if (this.loaded.has(polyfill)) continue;

      try {
        await this.loadPolyfill(polyfill);
        this.loaded.add(polyfill);
      } catch (error) {
        console.warn(`Failed to load polyfill: ${polyfill}`, error);
      }
    }
  }

  /**
   * Load individual polyfill
   */
  private static async loadPolyfill(name: string) {
    switch (name) {
      case 'intersection-observer':
        if (!('IntersectionObserver' in window)) {
          const script = document.createElement('script');
          script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver';
          document.head.appendChild(script);
          await this.waitForScript(script);
        }
        break;

      case 'resize-observer-polyfill':
        if (!('ResizeObserver' in window)) {
          const script = document.createElement('script');
          script.src = 'https://polyfill.io/v3/polyfill.min.js?features=ResizeObserver';
          document.head.appendChild(script);
          await this.waitForScript(script);
        }
        break;

      case 'web-share-polyfill':
        if (!('share' in navigator)) {
          // Simple web share fallback
          (navigator as any).share = async (data: ShareData) => {
            if (navigator.clipboard && data.url) {
              await navigator.clipboard.writeText(data.url);
              return Promise.resolve();
            }
            return Promise.reject(new Error('Web Share not supported'));
          };
        }
        break;
    }
  }

  /**
   * Wait for script to load
   */
  private static waitForScript(script: HTMLScriptElement): Promise<void> {
    return new Promise((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Script failed to load'));
    });
  }
}

/**
 * Progressive enhancement utilities
 */
export class ProgressiveEnhancement {
  /**
   * Apply progressive enhancements based on browser capabilities
   */
  static apply() {
    const features = FeatureDetector.getFeatures();

    // Apply CSS classes based on feature support
    this.applyCSSClasses(features);

    // Configure animations based on motion preference
    this.configureAnimations(features);

    // Configure touch interactions
    this.configureTouchInteractions(features);

    // Configure network-aware features
    this.configureNetworkFeatures(features);
  }

  /**
   * Apply CSS classes for feature detection
   */
  private static applyCSSClasses(features: Record<string, boolean>) {
    const html = document.documentElement;
    
    Object.entries(features).forEach(([feature, supported]) => {
      html.classList.add(supported ? `supports-${feature}` : `no-${feature}`);
    });
  }

  /**
   * Configure animations based on user preferences
   */
  private static configureAnimations(features: Record<string, boolean>) {
    if (features.reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.style.setProperty('--transition-duration', '0.01ms');
    }
  }

  /**
   * Configure touch interactions
   */
  private static configureTouchInteractions(features: Record<string, boolean>) {
    if (features.touchEvents) {
      document.documentElement.classList.add('touch-device');
      // Add touch-specific optimizations
      this.optimizeForTouch();
    } else {
      document.documentElement.classList.add('no-touch');
    }
  }

  /**
   * Optimize interface for touch devices
   */
  private static optimizeForTouch() {
    // Increase touch targets
    const style = document.createElement('style');
    style.textContent = `
      .touch-device .touch-target {
        min-height: 44px;
        min-width: 44px;
      }
      
      .touch-device button,
      .touch-device a,
      .touch-device [role="button"] {
        min-height: 44px;
        padding: 8px 12px;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Configure network-aware features
   */
  private static configureNetworkFeatures(features: Record<string, boolean>) {
    if (features.networkInformation) {
      const connection = (navigator as any).connection;
      if (connection) {
        const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                               connection.effectiveType === '2g' ||
                               connection.saveData;
        
        if (isSlowConnection) {
          document.documentElement.classList.add('slow-connection');
          this.optimizeForSlowConnection();
        }
      }
    }
  }

  /**
   * Optimize for slow connections
   */
  private static optimizeForSlowConnection() {
    // Reduce image quality
    const images = document.querySelectorAll('img[data-src]');
    images.forEach((img) => {
      const src = img.getAttribute('data-src');
      if (src && src.includes('q=')) {
        img.setAttribute('data-src', src.replace(/q=\d+/, 'q=60'));
      }
    });

    // Disable autoplay
    const videos = document.querySelectorAll('video[autoplay]');
    videos.forEach((video) => {
      video.removeAttribute('autoplay');
    });
  }
}

/**
 * Browser compatibility utilities
 */
export class BrowserUtils {
  /**
   * Get browser information
   */
  static getBrowserInfo() {
    const userAgent = navigator.userAgent;
    const vendor = navigator.vendor;

    let browser = 'unknown';
    let version = 'unknown';

    if (userAgent.includes('Chrome') && vendor.includes('Google')) {
      browser = 'chrome';
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Firefox')) {
      browser = 'firefox';
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Safari') && vendor.includes('Apple')) {
      browser = 'safari';
      version = userAgent.match(/Version\/(\d+)/)?.[1] || 'unknown';
    } else if (userAgent.includes('Edge')) {
      browser = 'edge';
      version = userAgent.match(/Edge\/(\d+)/)?.[1] || 'unknown';
    }

    return { browser, version, userAgent };
  }

  /**
   * Check if browser is supported
   */
  static isSupportedBrowser(): boolean {
    const { browser, version } = this.getBrowserInfo();
    const versionNum = parseInt(version);

    const minVersions: Record<string, number> = {
      chrome: 60,
      firefox: 60,
      safari: 12,
      edge: 79
    };

    return versionNum >= (minVersions[browser] || 0);
  }

  /**
   * Show browser upgrade message if needed
   */
  static showUpgradeMessageIfNeeded() {
    if (!this.isSupportedBrowser()) {
      const message = document.createElement('div');
      message.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #ff6b6b;
          color: white;
          padding: 12px;
          text-align: center;
          z-index: 10000;
          font-family: sans-serif;
        ">
          Your browser is outdated. Please upgrade for the best experience.
          <button onclick="this.parentElement.remove()" style="
            background: transparent;
            border: 1px solid white;
            color: white;
            margin-left: 12px;
            padding: 4px 8px;
            cursor: pointer;
          ">Dismiss</button>
        </div>
      `;
      document.body.appendChild(message);
    }
  }
}

/**
 * Initialize browser compatibility features
 */
export async function initBrowserCompatibility() {
  // Detect features
  FeatureDetector.detect();
  
  // Load required polyfills
  await PolyfillManager.loadRequired();
  
  // Apply progressive enhancements
  ProgressiveEnhancement.apply();
  
  // Show browser upgrade message if needed
  BrowserUtils.showUpgradeMessageIfNeeded();
  
  console.log('🌐 Browser compatibility initialized', {
    features: FeatureDetector.getFeatures(),
    browser: BrowserUtils.getBrowserInfo(),
    supported: BrowserUtils.isSupportedBrowser()
  });
}