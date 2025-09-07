import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";

export function useAuth() {
  // Clerk integration temporarily disabled - using existing auth system

  // Fall back to existing auth system
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      const timestamp = Date.now();
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      // Clerk token handling disabled

      const res = await fetch(`/api/auth/me?_t=${timestamp}`, {
        credentials: 'include',
        cache: 'no-cache',
        headers
      });
      
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      const userData = await res.json();
      return userData;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = '/';
    },
    onError: (error) => {
      queryClient.setQueryData(["/api/auth/me"], null);
      window.location.href = '/';
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}