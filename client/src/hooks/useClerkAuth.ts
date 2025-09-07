import { useUser, useClerk } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useClerkAuth() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut();
    },
    onSuccess: () => {
      queryClient.clear(); // Clear all cached data on logout
      window.location.href = '/';
    },
    onError: (error) => {
      // Force logout even if request fails
      window.location.href = '/';
    },
  });

  // Transform Clerk user to match your existing User interface
  const transformedUser = user ? {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress || '',
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    profileImageUrl: user.imageUrl,
    name: user.fullName,
    emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
    provider: 'clerk',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  } : null;

  return {
    user: transformedUser,
    isLoading: !isLoaded,
    isAuthenticated: isSignedIn && !!user,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}