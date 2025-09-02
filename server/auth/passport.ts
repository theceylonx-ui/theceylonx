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
  // Use the Replit development URL for OAuth callbacks
  const replitDevUrl = process.env.REPLIT_DOMAINS ? 
    `https://${process.env.REPLIT_DOMAINS}` : 
    'http://localhost:5000';
  const googleCallbackURL = `${replitDevUrl}/api/auth/google/callback`;
    
  console.log('🔧 Google OAuth callback URL configured:', {
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS,
    replitDevUrl,
    googleCallbackURL
  });
    
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
  // Dynamic callback URL based on environment
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.APP_URL?.includes('theceylonx.com');
  const facebookCallbackURL = isDevelopment 
    ? 'http://localhost:5000/api/auth/facebook/callback'
    : 'https://www.theceylonx.com/api/auth/facebook/callback';
    
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