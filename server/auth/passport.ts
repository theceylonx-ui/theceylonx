import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
// Microsoft and Apple strategies removed - using only Google and Facebook
import { db } from '../db';
import { users } from '@shared/schema';
import { eq, or } from 'drizzle-orm';
import { JWTUser } from './jwt';

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Dynamic callback URL detection for all environments
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isReplitDeployment = process.env.REPL_SLUG || process.env.REPLIT_DEPLOYMENT || process.env.REPLIT_DOMAINS;
  
  let googleCallbackURL;
  if (isReplitDeployment && process.env.REPLIT_DOMAINS) {
    // PRIORITY 1: Use Replit domain if available (even in development)
    const primaryDomain = process.env.REPLIT_DOMAINS.split(',')[0];
    googleCallbackURL = `https://${primaryDomain}/api/auth/google/callback`;
  } else if (isDevelopment) {
    // PRIORITY 2: Use localhost only for pure local development
    googleCallbackURL = 'http://localhost:5000/api/auth/google/callback';
  } else {
    // PRIORITY 3: Fallback to configured APP_URL or default
    const baseUrl = process.env.APP_URL || 'https://www.theceylonx.com';
    googleCallbackURL = `${baseUrl}/api/auth/google/callback`;
  }
  
  console.log('🔧 OAuth Configuration:', {
    isDevelopment,
    isReplitDeployment: !!isReplitDeployment,
    replitDomains: process.env.REPLIT_DOMAINS,
    configuredCallbackURL: googleCallbackURL
  });
    
  // Google OAuth callback configured
    
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: googleCallbackURL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(
        or(
          eq(users.googleId, profile.id),
          eq(users.email, profile.emails?.[0]?.value || '')
        )
      );

      if (existingUser) {
        // Update Google ID if not set
        if (!existingUser.googleId) {
          await db.update(users)
            .set({ googleId: profile.id })
            .where(eq(users.id, existingUser.id));
        }
        
        const jwtUser: JWTUser = {
          id: existingUser.id,
          email: existingUser.email || undefined,
          name: existingUser.name || undefined,
          provider: 'google'
        };
        
        return done(null, jwtUser);
      }

      // Create new user
      const [newUser] = await db.insert(users).values({
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        image: profile.photos?.[0]?.value,
        provider: 'google',
        googleId: profile.id,
        emailVerified: true,
      }).returning();

      const jwtUser: JWTUser = {
        id: newUser.id,
        email: newUser.email || undefined,
        name: newUser.name || undefined,
        provider: 'google'
      };

      return done(null, jwtUser);
    } catch (error) {
      return done(error, false);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  // Dynamic callback URL detection for all environments (same as Google)
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isReplitDeployment = process.env.REPL_SLUG || process.env.REPLIT_DEPLOYMENT || process.env.REPLIT_DOMAINS;
  
  let facebookCallbackURL;
  if (isReplitDeployment && process.env.REPLIT_DOMAINS) {
    // PRIORITY 1: Use Replit domain if available (even in development)
    const primaryDomain = process.env.REPLIT_DOMAINS.split(',')[0];
    facebookCallbackURL = `https://${primaryDomain}/api/auth/facebook/callback`;
  } else if (isDevelopment) {
    // PRIORITY 2: Use localhost only for pure local development
    facebookCallbackURL = 'http://localhost:5000/api/auth/facebook/callback';
  } else {
    // PRIORITY 3: Fallback to configured APP_URL or default
    const baseUrl = process.env.APP_URL || 'https://www.theceylonx.com';
    facebookCallbackURL = `${baseUrl}/api/auth/facebook/callback`;
  }
  
  console.log('🔧 Facebook OAuth Configuration:', {
    isDevelopment,
    isReplitDeployment: !!isReplitDeployment,
    configuredCallbackURL: facebookCallbackURL
  });
    
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: facebookCallbackURL,
    profileFields: ['id', 'displayName', 'photos']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists by Facebook ID
      const [existingUser] = await db.select().from(users).where(
        eq(users.facebookId, profile.id)
      );

      if (existingUser) {
        // Update Facebook ID if not set
        if (!existingUser.facebookId) {
          await db.update(users)
            .set({ facebookId: profile.id })
            .where(eq(users.id, existingUser.id));
        }
        
        const jwtUser: JWTUser = {
          id: existingUser.id,
          email: existingUser.email || undefined,
          name: existingUser.name || undefined,
          provider: 'facebook'
        };
        
        return done(null, jwtUser);
      }

      // Create new user
      const [newUser] = await db.insert(users).values({
        email: null, // Facebook no longer provides email by default
        name: profile.displayName,
        image: profile.photos?.[0]?.value,
        provider: 'facebook',
        facebookId: profile.id,
        emailVerified: false,
      }).returning();

      const jwtUser: JWTUser = {
        id: newUser.id,
        email: newUser.email || undefined,
        name: newUser.name || undefined,
        provider: 'facebook'
      };

      return done(null, jwtUser);
    } catch (error) {
      return done(error, false);
    }
  }));
}

// Microsoft OAuth strategy removed

// Apple OAuth strategy removed