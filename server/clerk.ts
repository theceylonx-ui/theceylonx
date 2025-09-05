import { clerkClient, getAuth, requireAuth as clerkRequireAuth } from "@clerk/express";

export { clerkClient };
export const withAuth = getAuth;
export const requireAuth = clerkRequireAuth;