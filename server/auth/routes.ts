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

const otpRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 OTP requests per hour
  message: { error: 'Too many OTP requests, please try again later.' },
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
  async (req: Request & { user?: JWTUser }, res: Response) => {
    if (!req.user) {
      return res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=oauth_failed`);
    }

    try {
      const tokens = await generateAuthTokens(req.user);
      setAuthCookies(res, tokens);
      res.redirect(`${process.env.APP_URL || ''}/auth/callback?success=1`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=callback_failed`);
    }
  }
);

// Microsoft OAuth
router.get('/microsoft', passport.authenticate('microsoft', {
  scope: ['user.read']
}));

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false }),
  async (req: Request & { user?: JWTUser }, res: Response) => {
    if (!req.user) {
      return res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=oauth_failed`);
    }

    try {
      const tokens = await generateAuthTokens(req.user);
      setAuthCookies(res, tokens);
      res.redirect(`${process.env.APP_URL || ''}/auth/callback?success=1`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=callback_failed`);
    }
  }
);

// Apple OAuth
router.get('/apple', passport.authenticate('apple'));

router.post('/apple/callback',
  passport.authenticate('apple', { session: false }),
  async (req: Request & { user?: JWTUser }, res: Response) => {
    if (!req.user) {
      return res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=oauth_failed`);
    }

    try {
      const tokens = await generateAuthTokens(req.user);
      setAuthCookies(res, tokens);
      res.redirect(`${process.env.APP_URL || ''}/auth/callback?success=1`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=callback_failed`);
    }
  }
);

// Email Magic Link Routes - DISABLED (using Phone and Google OAuth only)
router.post('/email/start', authRateLimit, async (req: Request, res: Response) => {
  res.status(503).json({ 
    error: 'Email authentication is currently disabled. Please use Phone or Google sign-in.' 
  });
});

router.get('/email/verify', async (req: Request, res: Response) => {
  res.redirect(`${process.env.APP_URL || ''}/auth/signin?error=email_auth_disabled`);
});

// Phone OTP Routes
router.post('/phone/send', otpRateLimit, async (req: Request, res: Response) => {
  if (!isPhoneConfigured()) {
    return res.status(503).json({ error: 'Phone authentication not configured' });
  }

  try {
    const { phone } = phoneStartSchema.parse(req.body);
    await sendPhoneOtp(phone);
    res.json({ success: true, message: 'Verification code sent to your phone' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Invalid phone number' });
    }
    console.error('Phone OTP send error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

router.post('/phone/verify', authRateLimit, async (req: Request, res: Response) => {
  if (!isPhoneConfigured()) {
    return res.status(503).json({ error: 'Phone authentication not configured' });
  }

  try {
    const { phone, code } = phoneVerifySchema.parse(req.body);
    const user = await verifyPhoneOtp(phone, code);
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const tokens = await generateAuthTokens(user);
    setAuthCookies(res, tokens);
    res.json({ success: true, message: 'Phone verification successful' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || 'Invalid input' });
    }
    console.error('Phone OTP verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Session Management Routes
router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookies(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(user);
});

// Get available authentication providers
router.get('/providers', (req: Request, res: Response) => {
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    microsoft: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
    apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY),
    email: isEmailConfigured(),
    phone: isPhoneConfigured(),
  };

  res.json(providers);
});

export { router as authRouter };
export { authGuard };