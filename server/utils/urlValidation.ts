/**
 * Security utilities for URL validation and safe navigation
 * 
 * SECURITY: Prevents open redirect vulnerabilities by validating URLs
 */

/**
 * Validates that a URL is safe for redirection (relative or same-origin only)
 */
export function isValidRedirectUrl(url: string, allowedOrigins?: string[]): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    // Allow relative URLs (starting with / but not //)
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }

    // Check if it's an absolute URL
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Check against allowed origins
    const defaultAllowedOrigins = [
      'https://www.theceylonx.com',
      'https://theceylonx.com',
      ...(process.env.NODE_ENV === 'development' ? [
        'http://localhost:5000',
        'http://localhost:5173',
        `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      ].filter(Boolean) : [])
    ];
    
    const origins = allowedOrigins || defaultAllowedOrigins;
    const urlOrigin = `${parsedUrl.protocol}//${parsedUrl.host}`;
    
    return origins.includes(urlOrigin);
    
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitizes URLs to ensure they are safe for use in application navigation
 * Returns null if URL is unsafe, sanitized relative URL if safe
 */
export function sanitizeRedirectUrl(url: string): string | null {
  if (!isValidRedirectUrl(url)) {
    return null;
  }

  try {
    // If it's already a relative URL, return as-is
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }

    // If it's an absolute URL but same-origin, convert to relative
    const parsedUrl = new URL(url);
    return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
    
  } catch (error) {
    return null;
  }
}

/**
 * Validates notification action URLs to prevent injection attacks
 */
export function validateNotificationActionUrl(url: string): boolean {
  if (!url) return false;
  
  // Must be relative path starting with /
  if (!url.startsWith('/')) return false;
  
  // Prevent protocol-relative URLs
  if (url.startsWith('//')) return false;
  
  // Prevent javascript: and data: URLs
  if (url.toLowerCase().match(/^(javascript|data|vbscript|file|blob):/)) return false;
  
  // Basic path validation - should contain only valid URL characters
  if (!url.match(/^\/[a-zA-Z0-9\/_?&#=%-]*$/)) return false;
  
  return true;
}

/**
 * Creates safe internal URLs for notifications
 */
export function createSafeActionUrl(path: string, params?: Record<string, string>): string {
  // Ensure path starts with /
  const safePath = path.startsWith('/') ? path : `/${path}`;
  
  // Validate the base path
  if (!validateNotificationActionUrl(safePath)) {
    throw new Error(`Invalid action URL path: ${path}`);
  }
  
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      // Sanitize parameter values
      if (key && value && typeof key === 'string' && typeof value === 'string') {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    return queryString ? `${safePath}?${queryString}` : safePath;
  }
  
  return safePath;
}

/**
 * Client-side safe navigation function
 * Should be used instead of direct window.location.href assignment
 */
export function navigateToUrl(url: string): void {
  const sanitizedUrl = sanitizeRedirectUrl(url);
  
  if (!sanitizedUrl) {
    console.warn('🔒 Navigation blocked: Invalid or unsafe URL:', url);
    return;
  }
  
  // Use window.location.assign for better security than direct href assignment
  window.location.assign(sanitizedUrl);
}