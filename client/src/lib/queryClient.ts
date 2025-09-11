import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Enhanced error parsing for better user feedback
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

function parseApiError(status: number, text: string): ApiError {
  try {
    const parsed = JSON.parse(text);
    return {
      message: parsed.message || parsed.error || 'Unknown error occurred',
      status,
      code: parsed.code,
      details: parsed.details
    };
  } catch {
    return {
      message: text || 'Unknown error occurred',
      status
    };
  }
}

function getErrorMessage(error: ApiError): string {
  // User-friendly error messages based on status codes
  switch (error.status) {
    case 400:
      return error.message.includes('validation') ? 
        'Please check your input and try again.' : 
        error.message;
    case 401:
      return 'Please sign in to continue.';
    case 403:
      return 'You don\'t have permission to access this resource.';
    case 404:
      return 'The requested item could not be found.';
    case 408:
      return 'Request timeout. Please try again.';
    case 409:
      return error.message || 'This action conflicts with existing data.';
    case 422:
      return 'Invalid data provided. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    const error = parseApiError(res.status, text);
    const userMessage = getErrorMessage(error);
    
    // Create enhanced error object
    const enhancedError = new Error(userMessage) as any;
    enhancedError.status = error.status;
    enhancedError.originalMessage = error.message;
    enhancedError.code = error.code;
    enhancedError.details = error.details;
    
    throw enhancedError;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: {
    timeout?: number;
    retries?: number;
    showErrorToast?: boolean;
  }
): Promise<Response> {
  const {
    timeout = 30000, // 30 seconds default timeout
    retries = 0,
    showErrorToast = false
  } = options || {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      await throwIfResNotOk(res);
      return res;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (4xx) or last attempt
      if (error.status && error.status >= 400 && error.status < 500) {
        break;
      }
      
      if (attempt < retries) {
        // Wait with exponential backoff before retry
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      break;
    }
  }

  clearTimeout(timeoutId);
  
  // Show error toast if requested and it's not a 401 (handled by auth)
  if (showErrorToast && lastError?.status !== 401) {
    toast({
      title: "Request Failed",
      description: lastError?.message || "Something went wrong",
      variant: "destructive",
      duration: 5000,
    });
  }
  
  throw lastError;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// 🚀 PHASE 3 PERFORMANCE: Optimized React Query configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // Smart default caching - balance between freshness and performance
      staleTime: 1000 * 60 * 5, // 5 minutes - data is considered fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - keep in memory longer for better UX
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors) or network abort
        if (error?.status && error.status >= 400 && error.status < 500) return false;
        if (error?.name === 'AbortError') return false;
        // Don't retry auth errors
        if (error?.status === 401) return false;
        
        return failureCount < 3; // Retry up to 3 times for server errors
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors) or auth errors
        if (error?.status && error.status >= 400 && error.status < 500) return false;
        if (error?.name === 'AbortError') return false;
        
        return failureCount < 2; // Retry up to 2 times for server errors
      },
      retryDelay: 2000, // 2 second delay between mutation retries
      
    },
  },
});

// 🚀 PERFORMANCE: Helper for setting specific cache times per query type
export const getCacheTime = (type: 'static' | 'semi-static' | 'dynamic' | 'realtime') => {
  switch (type) {
    case 'static': // Popular destinations, site settings, FAQ
      return { staleTime: 1000 * 60 * 30, gcTime: 1000 * 60 * 60 }; // 30min stale, 1hr gc
    case 'semi-static': // User profiles
      return { staleTime: 1000 * 60 * 10, gcTime: 1000 * 60 * 30 }; // 10min stale, 30min gc  
    case 'dynamic': // Trip data
      return { staleTime: 1000 * 60 * 2, gcTime: 1000 * 60 * 15 }; // 2min stale, 15min gc
    case 'realtime': // Messages, notifications
      return { staleTime: 1000 * 30, gcTime: 1000 * 60 * 5 }; // 30sec stale, 5min gc
    default:
      return { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 30 }; // Default
  }
};
