/**
 * Client-side URL validation and safe navigation utilities
 * 
 * SECURITY: Prevents open redirect vulnerabilities
 */

/**
 * Validates that a URL is safe for client-side navigation
 */
export function isValidRedirectUrl(url: string): boolean {
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

    // Check against current origin only (same-origin policy)
    const currentOrigin = window.location.origin;
    const urlOrigin = `${parsedUrl.protocol}//${parsedUrl.host}`;
    
    return urlOrigin === currentOrigin;
    
  } catch (error) {
    // Invalid URL
    return false;
  }
}

/**
 * Safe navigation function that validates URLs before navigation
 * Should be used instead of direct window.location.href assignment
 */
export function safeNavigate(url: string): boolean {
  if (!isValidRedirectUrl(url)) {
    console.warn('🔒 Navigation blocked: Invalid or unsafe URL:', url.substring(0, 100));
    return false;
  }
  
  try {
    // For relative URLs, use them directly
    if (url.startsWith('/') && !url.startsWith('//')) {
      window.location.assign(url);
      return true;
    }

    // For absolute same-origin URLs, convert to relative for safety
    const parsedUrl = new URL(url);
    const relativePath = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
    window.location.assign(relativePath);
    return true;
    
  } catch (error) {
    console.warn('🔒 Navigation failed:', error);
    return false;
  }
}

/**
 * Validates notification action URLs
 */
export function validateActionUrl(url: string): boolean {
  if (!url) return false;
  
  // Must be relative path
  if (!url.startsWith('/')) return false;
  
  // Prevent protocol-relative URLs
  if (url.startsWith('//')) return false;
  
  // Prevent dangerous schemes
  if (url.toLowerCase().match(/^(javascript|data|vbscript|file|blob):/)) return false;
  
  return true;
}