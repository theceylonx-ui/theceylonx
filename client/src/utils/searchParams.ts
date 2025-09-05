/**
 * Utility functions for managing URL search parameters
 * Helps preserve query state across navigation in Ceylon Expand
 */

export interface SearchParamsHelper {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
  toString: () => string;
  toObject: () => Record<string, string>;
}

/**
 * Creates a helper for managing URL search parameters
 * @param initialSearch Optional initial search string (defaults to current location)
 */
export function createSearchParamsHelper(initialSearch?: string): SearchParamsHelper {
  const params = new URLSearchParams(initialSearch || window.location.search);

  return {
    get: (key: string) => params.get(key),
    set: (key: string, value: string) => params.set(key, value),
    delete: (key: string) => params.delete(key),
    toString: () => params.toString(),
    toObject: () => Object.fromEntries(params.entries())
  };
}

/**
 * Preserves current search parameters when navigating to a new route
 * @param basePath The base path to navigate to
 * @param additionalParams Optional additional parameters to include
 * @param excludeParams Optional parameters to exclude from preservation
 */
export function preserveSearch(
  basePath: string, 
  additionalParams?: Record<string, string>,
  excludeParams?: string[]
): string {
  const helper = createSearchParamsHelper();
  
  // Remove excluded parameters
  if (excludeParams) {
    excludeParams.forEach(param => helper.delete(param));
  }
  
  // Add additional parameters
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      helper.set(key, value);
    });
  }
  
  const searchString = helper.toString();
  return searchString ? `${basePath}?${searchString}` : basePath;
}

/**
 * Gets the current search parameters as a query string (with leading ?)
 */
export function getCurrentSearch(): string {
  const search = window.location.search;
  return search || '';
}

/**
 * Checks if the current URL has any search parameters
 */
export function hasSearchParams(): boolean {
  return window.location.search.length > 0;
}

/**
 * Creates a URL with preserved search parameters for trip detail linking
 * @param tripId The trip ID to link to
 * @param preserveFilters Whether to preserve current filter state
 */
export function createTripDetailLink(tripId: string, preserveFilters = true): string {
  if (!preserveFilters) {
    return `/trips/${tripId}`;
  }
  
  const currentSearch = getCurrentSearch();
  const helper = createSearchParamsHelper(currentSearch);
  
  // Add the original search as a returnTo parameter so we can navigate back
  if (currentSearch) {
    helper.set('returnTo', encodeURIComponent(`/trips${currentSearch}`));
  }
  
  const newSearch = helper.toString();
  return newSearch ? `/trips/${tripId}?${newSearch}` : `/trips/${tripId}`;
}

/**
 * Creates a back link that returns to the trips listing with preserved filters
 * @param fallbackPath Fallback path if no returnTo parameter exists
 */
export function createBackToTripsLink(fallbackPath = '/browse-trips'): string {
  const helper = createSearchParamsHelper();
  const returnTo = helper.get('returnTo');
  
  if (returnTo) {
    try {
      return decodeURIComponent(returnTo);
    } catch {
      // If decoding fails, fall back to default
      return fallbackPath;
    }
  }
  
  return fallbackPath;
}

/**
 * Creates a login redirect URL that returns user to their original destination
 * @param currentPath Current path including search parameters
 */
export function createLoginRedirectUrl(currentPath?: string): string {
  const path = currentPath || `${window.location.pathname}${window.location.search}`;
  const encodedPath = encodeURIComponent(path);
  return `/login?redirect=${encodedPath}`;
}

/**
 * Gets the redirect path from login URL parameters
 */
export function getLoginRedirectPath(): string {
  const helper = createSearchParamsHelper();
  const redirect = helper.get('redirect');
  
  if (redirect) {
    try {
      return decodeURIComponent(redirect);
    } catch {
      return '/';
    }
  }
  
  return '/';
}

/**
 * Updates a single search parameter while preserving others
 * @param key Parameter key to update
 * @param value New value (null to remove)
 * @param navigate Navigation function to call with new URL
 */
export function updateSearchParam(
  key: string, 
  value: string | null, 
  navigate: (path: string) => void
): void {
  const helper = createSearchParamsHelper();
  
  if (value === null) {
    helper.delete(key);
  } else {
    helper.set(key, value);
  }
  
  const newSearch = helper.toString();
  const newPath = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
  
  navigate(newPath);
}