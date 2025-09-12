import jwt from 'jsonwebtoken';
import { Response, Request, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, authSessions } from '@shared/schema';
import { eq, gt } from 'drizzle-orm';

export interface JWTUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  provider?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// JWT Configuration
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d'; // SECURITY: Reduced from 30d for better security

// Cookie Configuration
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

// Enhanced environment detection for Replit deployment
const isDevelopment = process.env.NODE_ENV === 'development';
const isReplitProduction = Boolean(process.env.REPLIT_DEPLOYMENT === '1' || process.env.REPL_SLUG);
const isProduction = process.env.NODE_ENV === 'production' || isReplitProduction;

// Domain configuration - no domain restriction for Replit deployments
const effectiveCookieDomain = isDevelopment || isReplitProduction ? undefined : COOKIE_DOMAIN;

// Cookie security - prioritize Replit environment detection
const effectiveCookieSecure = (() => {
  // ALWAYS false for Replit environments (they handle SSL/TLS automatically)
  if (process.env.REPL_SLUG || process.env.REPLIT_DEPLOYMENT || process.env.REPLIT_DOMAINS) {
    console.log("🔧 Forcing cookie secure=false for Replit environment");
    return false;
  }
  
  // Always false for development
  if (process.env.NODE_ENV === 'development') return false;
  
  // Explicit override via environment variable only for non-Replit environments
  if (process.env.COOKIE_SECURE === 'false') return false;
  if (process.env.COOKIE_SECURE === 'true') return true;
  
  // SECURITY: Default to true for production environments for enterprise security
  if (isProduction) return true;
  
  // Default to false for maximum compatibility in development
  return false;
})();

// Cookie configuration for environment

export function signAccessToken(user: JWTUser): string {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { 
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'ceylon-expand'
  });
}

export function signRefreshToken(): string {
  return jwt.sign({ tokenId: nanoid() }, REFRESH_TOKEN_SECRET, { 
    expiresIn: REFRESH_TOKEN_EXPIRY,
    issuer: 'ceylon-expand'
  });
}

export function verifyAccessToken(token: string): JWTUser | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTUser;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): any | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
}

export async function createAuthSession(userId: string): Promise<string> {
  const refreshToken = signRefreshToken();
  const hashedToken = await bcrypt.hash(refreshToken, 12); // SECURITY: Increased bcrypt rounds
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // SECURITY: 7 days (reduced from 30)

  await db.insert(authSessions).values({
    userId,
    refreshToken: hashedToken,
    expiresAt
  });

  return refreshToken;
}

export async function generateAuthTokens(user: JWTUser): Promise<AuthTokens> {
  const accessToken = signAccessToken(user);
  const refreshToken = await createAuthSession(user.id);

  return { accessToken, refreshToken };
}

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  const cookieOptions = {
    httpOnly: true,
    secure: effectiveCookieSecure,
    sameSite: 'strict' as const,
    domain: effectiveCookieDomain,
    // SECURITY: Align cookie maxAge with actual token TTLs
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days - matches refresh token TTL
  };

  // Remove undefined domain
  if (!cookieOptions.domain) {
    delete cookieOptions.domain;
  }

  res.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes - matches access token TTL
  });

  res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
}

export function clearAuthCookies(res: Response): void {
  const cookieOptions = {
    httpOnly: true,
    secure: effectiveCookieSecure,
    sameSite: 'strict' as const, // SECURITY: Changed from lax to strict
    domain: effectiveCookieDomain,
  };

  // Remove undefined domain
  if (!cookieOptions.domain) {
    delete cookieOptions.domain;
  }

  // SECURITY: Removed cookie options logging

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
}

export async function refreshUserTokens(refreshToken: string): Promise<AuthTokens | null> {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return null;

  // SECURITY: Find active sessions (not expired) with constant-time validation
  const sessions = await db.select().from(authSessions).where(
    gt(authSessions.expiresAt, new Date())
  );

  let validSession = null;
  let isValidToken = false;
  
  // SECURITY: Use constant-time comparison to prevent timing attacks
  for (const session of sessions) {
    const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
    if (isMatch && !validSession) { // Only set first match to maintain constant time
      validSession = session;
      isValidToken = true;
    }
  }

  if (!validSession || !isValidToken || validSession.expiresAt < new Date()) {
    return null;
  }

  // SECURITY: Token rotation - invalidate old refresh token
  await db.delete(authSessions).where(eq(authSessions.id, validSession.id));

  // Get user data
  const [user] = await db.select().from(users).where(eq(users.id, validSession.userId));
  if (!user) return null;

  // Generate new tokens with rotation
  const jwtUser: JWTUser = {
    id: user.id,
    email: user.email || undefined,
    phone: user.phone || undefined,
    name: user.name || undefined,
    provider: user.provider || undefined,
  };

  // SECURITY: Create completely new token pair (rotation)
  return generateAuthTokens(jwtUser);
}

export async function authGuard(req: Request & { user?: JWTUser }, res: Response, next: NextFunction): Promise<void> {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Try to verify access token
  let user = null;
  if (accessToken) {
    user = verifyAccessToken(accessToken);
  }

  // If access token is invalid but refresh token exists, try to refresh
  if (!user && refreshToken) {
    const newTokens = await refreshUserTokens(refreshToken);
    if (newTokens) {
      setAuthCookies(res, newTokens);
      user = verifyAccessToken(newTokens.accessToken);
    }
  }

  if (!user) {
    clearAuthCookies(res);
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  req.user = user;
  next();
}

export async function getCurrentUser(req: Request, res?: Response): Promise<JWTUser | null> {
  // SECURITY: Development-only debugging to prevent PII logging in production
  if (isDevelopment) {
    console.log("🔍 JWT Auth - Environment:", { isDevelopment, isProduction, isReplitProduction });
    console.log("🔍 JWT Auth - Cookie settings:", { effectiveCookieSecure, effectiveCookieDomain });
    console.log("🔍 JWT Auth - Cookies received:", Object.keys(req.cookies || {}));
    console.log("🔍 JWT Auth - Authorization header:", req.headers.authorization ? "present" : "not present");
  }
  
  // Try to get token from cookies first
  let accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;
  
  // If not in cookies, try Authorization header
  if (!accessToken) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }
  }
  
  // Try to verify access token
  let user = null;
  if (accessToken) {
    user = verifyAccessToken(accessToken);
  }

  // If access token is invalid but refresh token exists, try to refresh
  if (!user && refreshToken && res) {
    if (isDevelopment) console.log("🔄 Access token invalid, attempting refresh...");
    const newTokens = await refreshUserTokens(refreshToken);
    if (newTokens) {
      setAuthCookies(res, newTokens);
      user = verifyAccessToken(newTokens.accessToken);
      if (isDevelopment) console.log("✅ Token refresh successful");
    } else {
      if (isDevelopment) console.log("❌ Token refresh failed");
    }
  }
  
  if (!accessToken && !refreshToken) {
    if (isDevelopment) console.log("❌ No access token found");
    return null;
  }

  if (isDevelopment) {
    console.log("🔍 JWT verification result:", user ? "✅ valid" : "❌ invalid");
    // SECURITY: Only log user ID in development - no email/PII
    if (user) {
      console.log("✅ JWT user details:", { id: user.id, provider: user.provider });
    } else {
      console.log("🔍 Debug: accessToken present:", !!accessToken, "refreshToken present:", !!refreshToken);
      if (accessToken) {
        try {
          const decoded = jwt.decode(accessToken);
          console.log("🔍 Token decode result:", decoded ? "success" : "failed");
          if (decoded && typeof decoded === 'object' && 'exp' in decoded) {
            const now = Math.floor(Date.now() / 1000);
            console.log("🔍 Token expiry check:", { exp: decoded.exp, now, expired: decoded.exp < now });
          }
        } catch (e) {
          console.log("🔍 Token decode error:", e instanceof Error ? e.message : 'unknown');
        }
      }
    }
  }
  return user;
}