import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
        // Don't retry on 4xx errors (client errors)
        if (error?.message?.startsWith('4')) return false;
        return failureCount < 2; // Retry up to 2 times for server errors
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors) 
        if (error?.message?.startsWith('4')) return false;
        return failureCount < 1; // Retry once for server errors
      },
      retryDelay: 1000, // 1 second delay between mutation retries
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
