import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as AppleStrategy } from 'passport-apple';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq, or } from 'drizzle-orm';
import { JWTUser } from './jwt';

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/google/callback`
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
      return done(error, null);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `https://${process.env.REPLIT_DEV_DOMAIN}/api/auth/facebook/callback`,
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
      return done(error, null);
    }
  }));
}

// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: '/api/auth/microsoft/callback',
    tenant: process.env.MICROSOFT_TENANT_ID || 'common',
    scope: ['user.read']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(
        or(
          eq(users.microsoftId, profile.id),
          eq(users.email, profile.emails?.[0]?.value || '')
        )
      );

      if (existingUser) {
        // Update Microsoft ID if not set
        if (!existingUser.microsoftId) {
          await db.update(users)
            .set({ microsoftId: profile.id })
            .where(eq(users.id, existingUser.id));
        }
        
        const jwtUser: JWTUser = {
          id: existingUser.id,
          email: existingUser.email || undefined,
          name: existingUser.name || undefined,
          provider: 'microsoft'
        };
        
        return done(null, jwtUser);
      }

      // Create new user
      const [newUser] = await db.insert(users).values({
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        image: profile.photos?.[0]?.value,
        provider: 'microsoft',
        microsoftId: profile.id,
        emailVerified: true,
      }).returning();

      const jwtUser: JWTUser = {
        id: newUser.id,
        email: newUser.email || undefined,
        name: newUser.name || undefined,
        provider: 'microsoft'
      };

      return done(null, jwtUser);
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Apple OAuth Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_PRIVATE_KEY) {
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID!,
    keyID: process.env.APPLE_KEY_ID!,
    privateKey: process.env.APPLE_PRIVATE_KEY!,
    callbackURL: '/api/auth/apple/callback'
  },
  async (accessToken, refreshToken, idToken, profile, done) => {
    try {
      // Apple provides limited profile info
      const appleId = profile.id;
      const email = profile.email;

      // Check if user already exists
      const [existingUser] = await db.select().from(users).where(
        or(
          eq(users.appleId, appleId),
          email ? eq(users.email, email) : undefined
        ).filter(Boolean)
      );

      if (existingUser) {
        // Update Apple ID if not set
        if (!existingUser.appleId) {
          await db.update(users)
            .set({ appleId })
            .where(eq(users.id, existingUser.id));
        }
        
        const jwtUser: JWTUser = {
          id: existingUser.id,
          email: existingUser.email || undefined,
          name: existingUser.name || undefined,
          provider: 'apple'
        };
        
        return done(null, jwtUser);
      }

      // Create new user
      const [newUser] = await db.insert(users).values({
        email: email || undefined,
        name: profile.name?.firstName && profile.name?.lastName 
          ? `${profile.name.firstName} ${profile.name.lastName}` 
          : undefined,
        provider: 'apple',
        appleId,
        emailVerified: !!email,
      }).returning();

      const jwtUser: JWTUser = {
        id: newUser.id,
        email: newUser.email || undefined,
        name: newUser.name || undefined,
        provider: 'apple'
      };

      return done(null, jwtUser);
    } catch (error) {
      return done(error, null);
    }
  }));
}