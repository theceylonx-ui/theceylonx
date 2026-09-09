/**
 * Utility functions for managing URL search parameters
 * Helps preserve query state across navigation in HiBowan
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
  } else {
    // If no search params, still preserve the browse route
    helper.set('returnTo', encodeURIComponent('/trips'));
  }
  
  const newSearch = helper.toString();
  return newSearch ? `/trips/${tripId}?${newSearch}` : `/trips/${tripId}`;
}

/**
 * Creates a back link that returns to the trips listing with preserved filters
 * @param fallbackPath Fallback path if no returnTo parameter exists
 */
export function createBackToTripsLink(fallbackPath = '/trips'): string {
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
 * Creates a Post Trip URL with returnTo context for seamless back navigation
 * @param currentPath Current path with search parameters to return to
 */
export function createPostTripLink(currentPath?: string): string {
  const pathToReturn = currentPath || `${window.location.pathname}${window.location.search}`;
  const encodedPath = encodeURIComponent(pathToReturn);
  return `/post?returnTo=${encodedPath}`;
}

/**
 * Enhanced utility to preserve filters in Zustand store and URL sync
 */
export interface FilterState {
  from: string;
  to: string;
  date: string;
  region: string;
  minPrice: string;
  maxPrice: string;
  search: string;
  view?: 'list' | 'map';
  page?: number;
}

/**
 * Encodes filter state into URL parameters
 */
export function encodeFiltersToUrl(filters: FilterState): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== '') {
      params.set(key, value.toString());
    }
  });
  
  return params.toString();
}

/**
 * Decodes URL parameters into filter state
 */
export function decodeFiltersFromUrl(search: string = window.location.search): FilterState {
  const params = new URLSearchParams(search);
  
  return {
    from: params.get('from') || '',
    to: params.get('to') || '',
    date: params.get('date') || '',
    region: params.get('region') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    search: params.get('search') || '',
    view: (params.get('view') as 'list' | 'map') || 'list',
    page: parseInt(params.get('page') || '1', 10)
  };
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