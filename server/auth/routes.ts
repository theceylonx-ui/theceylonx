import { Router, Request, Response } from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { 
  generateAuthTokens, 
  setAuthCookies, 
  clearAuthCookies, 
  getCurrentUser,
  authGuard,
  JWTUser 
} from './jwt';
import { sendMagicLink, verifyMagicLink, isEmailConfigured } from './email';
import { sendPhoneOtp, verifyPhoneOtp, isPhoneConfigured } from './phone';
import { emailAuthSchema, phoneStartSchema, phoneVerifySchema } from '@shared/schema';
import './passport'; // Initialize passport strategies

const router = Router();

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});


// OAuth Routes

// Google OAuth
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  (req, res, next) => {
    console.log('🔄 Google OAuth callback received - before passport auth');
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 Request query:', req.query);
    next();
  },
  passport.authenticate('google', { session: false }),
  async (req: any, res: Response) => {
    console.log('🔄 Google OAuth callback received - after passport auth');
    
    // Use the same URL that Google redirected to (from the request)
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    console.log('🔍 Google OAuth callback URL detection:', {
      protocol,
      host,
      baseUrl,
      'x-forwarded-proto': req.get('x-forwarded-proto'),
      'original-url': req.originalUrl
    });
    
    if (!req.user) {
      console.log('❌ Google OAuth failed - no user object received');
      return res.redirect(`${baseUrl}/auth/signin?error=oauth_failed`);
    }

    try {
      console.log('✅ Google OAuth success for user:', req.user.email || req.user.id);
      const tokens = await generateAuthTokens(req.user);
      setAuthCookies(res, tokens);
      console.log('🍪 Auth cookies set, redirecting to callback page');
      res.redirect(`${baseUrl}/auth/callback?success=1`);
    } catch (error) {
      console.error('❌ Google OAuth callback error:', error);
      res.redirect(`${baseUrl}/auth/signin?error=callback_failed`);
    }
  }
);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', {
  scope: ['public_profile']
}));

router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false }),
  async (req: any, res: Response) => {
    console.log('🔄 Facebook OAuth callback received');
    
    // Use localhost for development, production URL for production
    // Check if we're running locally (no REPLIT_DOMAINS means local development)
    const isLocalDev = !process.env.REPLIT_DOMAINS || req.get('host')?.includes('localhost') || process.env.NODE_ENV === 'development';
    const baseUrl = isLocalDev ? 'http://localhost:5000' : (process.env.APP_URL || 'https://www.theceylonx.com');
    
    console.log('🔍 Facebook OAuth callback URL detection:', {
      NODE_ENV: process.env.NODE_ENV,
      host: req.get('host'),
      REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
      isLocalDev,
      baseUrl
    });
    
    if (!req.user) {
      console.log('❌ Facebook OAuth failed - no user object received');
      return res.redirect(`${baseUrl}/auth/signin?error=oauth_failed`);
    }

    try {
      console.log('✅ Facebook OAuth success for user:', req.user.name || req.user.id);
      const tokens = await generateAuthTokens(req.user);
      setAuthCookies(res, tokens);
      console.log('🍪 Auth cookies set, redirecting to callback page');
      res.redirect(`${baseUrl}/auth/callback?success=1`);
    } catch (error) {
      console.error('❌ Facebook OAuth callback error:', error);
      res.redirect(`${baseUrl}/auth/signin?error=callback_failed`);
    }
  }
);

// Microsoft OAuth removed

// Apple OAuth removed

// Email Magic Link Routes - DISABLED (using Phone and Google OAuth only)
router.post('/email/start', authRateLimit, async (req: Request, res: Response) => {
  return res.status(503).json({ 
    error: 'Email authentication is currently disabled. Please use Phone or Google sign-in.' 
  });
});

router.get('/email/verify', async (req: Request, res: Response) => {
  return res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=email_auth_disabled`);
});

// Phone authentication removed - Google OAuth only
router.post('/phone/send', authRateLimit, async (req: Request, res: Response) => {
  return res.status(503).json({ error: 'Phone authentication has been disabled. Please use Google sign-in.' });
});

router.post('/phone/verify', authRateLimit, async (req: Request, res: Response) => {
  return res.status(503).json({ error: 'Phone authentication has been disabled. Please use Google sign-in.' });
});

// Session Management Routes
router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookies(res);
  return res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', async (req: Request, res: Response) => {
  const jwtUser = await getCurrentUser(req);
  if (!jwtUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  // CRITICAL FIX: Get fresh user data from database instead of using stale JWT data
  const { storage } = await import('../storage');
  const freshUser = await storage.getUser(jwtUser.id);
  if (!freshUser) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  // Return fresh database data with JWT auth info
  const responseUser = {
    id: freshUser.id,
    email: freshUser.email,
    name: freshUser.name,
    username: freshUser.username,
    bio: freshUser.bio,
    phone: freshUser.phone,
    profileImageUrl: freshUser.profileImageUrl,
    provider: jwtUser.provider,
    emailVerified: freshUser.emailVerified,
    createdAt: freshUser.createdAt,
    updatedAt: freshUser.updatedAt,
  };
  
  console.log("🔄 /api/auth/me returning fresh user data:", { 
    username: responseUser.username, 
    bio: responseUser.bio ? responseUser.bio.substring(0, 30) : null,
    updatedAt: responseUser.updatedAt 
  });
  
  // Add cache-busting headers to prevent browser caching
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  return res.json(responseUser);
});

// Get available authentication providers
router.get('/providers', (req: Request, res: Response) => {
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    microsoft: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
    apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY),
    email: false, // Disabled
    phone: false, // Disabled
  };

  return res.json(providers);
});

export { router as authRouter };
export { authGuard };