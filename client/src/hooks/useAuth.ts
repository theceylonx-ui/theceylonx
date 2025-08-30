import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
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
      console.error('Logout error:', error);
      // Force logout even if request fails
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