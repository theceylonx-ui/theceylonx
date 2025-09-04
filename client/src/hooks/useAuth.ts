import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";

export function useAuth() {
  // Check if Clerk is available and configured
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const isClerkEnabled = clerkPubKey && clerkPubKey !== 'pk_test_placeholder' && clerkPubKey.startsWith('pk_');

  // Use Clerk auth if available
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser, getToken } = useClerkAuth();

  // Transform Clerk user to match existing interface
  const transformedClerkUser = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    username: clerkUser.username,
    profileImageUrl: clerkUser.imageUrl,
    name: clerkUser.fullName,
    provider: 'clerk'
  } : null;

  // If Clerk is enabled and loaded, use Clerk auth
  if (isClerkEnabled && clerkLoaded) {
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
      isLoading: !clerkLoaded,
      isAuthenticated: isSignedIn && !!clerkUser,
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
      if (isClerkEnabled && getToken) {
        try {
          const token = await getToken();
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