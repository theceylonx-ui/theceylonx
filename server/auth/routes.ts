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
  passport.authenticate('google', { session: false }),
  async (req: any, res: Response) => {
    if (!req.user) {
      return res.redirect('https://www.theceylonx.com/auth/signin?error=oauth_failed');
    }

    try {
      const tokens = await generateAuthTokens(req.user);
      setAuthCookies(res, tokens);
      res.redirect('https://www.theceylonx.com/auth/callback?success=1');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('https://www.theceylonx.com/auth/signin?error=callback_failed');
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
    if (!req.user) {
      return res.redirect('https://www.theceylonx.com/auth/signin?error=oauth_failed');
    }

    try {
      const tokens = await generateAuthTokens(req.user);
      setAuthCookies(res, tokens);
      res.redirect('https://www.theceylonx.com/auth/callback?success=1');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('https://www.theceylonx.com/auth/signin?error=callback_failed');
    }
  }
);

// Microsoft OAuth removed

// Apple OAuth removed

// Email Magic Link Routes - DISABLED (using Phone and Google OAuth only)
router.post('/email/start', authRateLimit, async (req: Request, res: Response) => {
  res.status(503).json({ 
    error: 'Email authentication is currently disabled. Please use Phone or Google sign-in.' 
  });
});

router.get('/email/verify', async (req: Request, res: Response) => {
  res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=email_auth_disabled`);
});

// Phone authentication removed - Google OAuth only
router.post('/phone/send', authRateLimit, async (req: Request, res: Response) => {
  res.status(503).json({ error: 'Phone authentication has been disabled. Please use Google sign-in.' });
});

router.post('/phone/verify', authRateLimit, async (req: Request, res: Response) => {
  res.status(503).json({ error: 'Phone authentication has been disabled. Please use Google sign-in.' });
});

// Session Management Routes
router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
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
  
  res.json(responseUser);
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

  res.json(providers);
});

export { router as authRouter };
export { authGuard };