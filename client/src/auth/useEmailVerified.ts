import { useUser } from "@clerk/clerk-react";

export function useEmailVerified() {
  const { user, isLoaded } = useUser();
  const verified = !!user?.primaryEmailAddress && user.primaryEmailAddress.verification?.status === "verified";
  return { isLoaded, verified };
}