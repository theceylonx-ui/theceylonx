import { verifyToken } from '@clerk/clerk-sdk-node';
import type { Request, Response, NextFunction } from 'express';

// Clerk middleware for verifying JWT tokens
export const clerkAuth = async (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.clerkUser = null;
      return next();
    }

    const token = authHeader.substring(7);
    const verificationResult = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    req.auth = verificationResult;
    req.clerkUser = getClerkUser(req);
    next();
  } catch (error) {
    req.clerkUser = null;
    next();
  }
};

// Extract Clerk user information
export function getClerkUser(req: any) {
  if (req.auth && req.auth.userId) {
    return {
      id: req.auth.userId,
      email: req.auth.sessionClaims?.email,
      name: req.auth.sessionClaims?.firstName || req.auth.sessionClaims?.fullName,
      firstName: req.auth.sessionClaims?.firstName,
      lastName: req.auth.sessionClaims?.lastName,
      username: req.auth.sessionClaims?.username,
      profileImageUrl: req.auth.sessionClaims?.imageUrl,
      provider: 'clerk'
    };
  }
  return null;
}

// Optional Clerk middleware that doesn't require auth but extracts user if present
export const clerkAuthOptional = (req: any, res: Response, next: NextFunction) => {
  try {
    // Try to get Clerk user without requiring authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // If there's a bearer token, try to verify it with Clerk
      clerkAuth(req, res, (err?: any) => {
        if (err) {
          // If Clerk auth fails, continue without user
          req.clerkUser = null;
        } else {
          req.clerkUser = getClerkUser(req);
        }
        next();
      });
    } else {
      req.clerkUser = null;
      next();
    }
  } catch (error) {
    req.clerkUser = null;
    next();
  }
};