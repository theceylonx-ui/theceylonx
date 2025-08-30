import jwt from 'jsonwebtoken';
import { Response, Request, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { db } from '../db';
import { users, authSessions } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
const REFRESH_TOKEN_EXPIRY = '30d';

// Cookie Configuration
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';

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
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

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
    secure: COOKIE_SECURE,
    sameSite: 'lax' as const,
    domain: COOKIE_DOMAIN,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  // Remove domain for localhost
  if (COOKIE_DOMAIN === 'localhost') {
    delete cookieOptions.domain;
  }

  res.cookie('accessToken', tokens.accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', tokens.refreshToken, cookieOptions);
}

export function clearAuthCookies(res: Response): void {
  const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax' as const,
    domain: COOKIE_DOMAIN,
  };

  // Remove domain for localhost
  if (COOKIE_DOMAIN === 'localhost') {
    delete cookieOptions.domain;
  }

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
}

export async function refreshUserTokens(refreshToken: string): Promise<AuthTokens | null> {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return null;

  // Find session with matching refresh token
  const sessions = await db.select().from(authSessions).where(
    eq(authSessions.expiresAt, new Date()) // This should be a proper date comparison
  );

  let validSession = null;
  for (const session of sessions) {
    if (await bcrypt.compare(refreshToken, session.refreshToken)) {
      validSession = session;
      break;
    }
  }

  if (!validSession || validSession.expiresAt < new Date()) {
    return null;
  }

  // Get user data
  const [user] = await db.select().from(users).where(eq(users.id, validSession.userId));
  if (!user) return null;

  // Generate new tokens
  const jwtUser: JWTUser = {
    id: user.id,
    email: user.email || undefined,
    phone: user.phone || undefined,
    name: user.name || undefined,
    provider: user.provider || undefined,
  };

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

export async function getCurrentUser(req: Request): Promise<JWTUser | null> {
  const accessToken = req.cookies.accessToken;
  if (!accessToken) return null;

  return verifyAccessToken(accessToken);
}