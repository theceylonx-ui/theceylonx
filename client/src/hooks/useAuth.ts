import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";

export function useAuth() {
  // Check if Clerk is available and configured
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const isClerkEnabled = clerkPubKey && 
    clerkPubKey !== 'pk_test_placeholder' && 
    clerkPubKey.startsWith('pk_') &&
    clerkPubKey.length > 50;

  // Try to use Clerk auth if available
  let clerkAuth = null;
  try {
    if (isClerkEnabled && typeof window !== 'undefined') {
      const { useAuth: useClerkAuth } = require("@clerk/clerk-react");
      clerkAuth = useClerkAuth();
    }
  } catch (error) {
    console.log('Clerk not available, using fallback auth');
  }

  // Use Clerk auth if properly loaded
  if (clerkAuth && clerkAuth.isLoaded && clerkAuth.isSignedIn) {
    const transformedClerkUser = clerkAuth.user ? {
      id: clerkAuth.user.id,
      email: clerkAuth.user.emailAddresses?.[0]?.emailAddress || '',
      firstName: clerkAuth.user.firstName,
      lastName: clerkAuth.user.lastName,
      username: clerkAuth.user.username,
      profileImageUrl: clerkAuth.user.imageUrl,
      name: clerkAuth.user.fullName,
      provider: 'clerk'
    } : null;
    const logoutMutation = useMutation({
      mutationFn: async () => {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      },
      onSuccess: () => {
        queryClient.clear();
        window.location.href = '/';
      },
    });

    return {
      user: transformedClerkUser,
      isLoading: !clerkAuth.isLoaded,
      isAuthenticated: clerkAuth.isSignedIn && !!transformedClerkUser,
      logout: () => logoutMutation.mutate(),
      isLoggingOut: logoutMutation.isPending,
    };
  }

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

      // Add Clerk token if available
      if (clerkAuth && clerkAuth.getToken) {
        try {
          const token = await clerkAuth.getToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.log('No Clerk token available');
        }
      }

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
      console.log("🔄 useAuth fetched user data:", userData);
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
      console.error('Logout error:', error);
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