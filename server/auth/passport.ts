import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
// Microsoft and Apple strategies removed - using only Google and Facebook
import { db } from '../db';
import { users, roles } from '@shared/schema';
import { eq, or } from 'drizzle-orm';
import { JWTUser } from './jwt';
import { ALL_PERMS } from '../admin/permissions';

// Helper to check if email is a designated superadmin
const isSuperadminEmail = (email: string): boolean => {
  const superadminEmails = process.env.SUPERADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return superadminEmails.includes(email.toLowerCase());
};

// Helper to assign superadmin role to a user
const assignSuperadminRole = async (userId: string): Promise<void> => {
  try {
    console.log(`🔐 Attempting to assign superadmin role to user ${userId}`);
    
    // Find or create superadmin role with ALL permissions (not just '*')
    let [superadminRole] = await db.select().from(roles).where(eq(roles.name, 'superadmin'));
    
    if (!superadminRole) {
      // Create superadmin role with all permissions
      console.log('🔐 Creating new superadmin role with all permissions');
      const insertedRoles = await db.insert(roles).values({
        name: 'superadmin',
        displayName: 'Superadmin',
        description: 'Full system access',
        permissions: ALL_PERMS, // Full permissions array
        isSystem: true,
      }).returning();
      if (Array.isArray(insertedRoles)) {
        superadminRole = insertedRoles[0];
      }
    } else {
      // Ensure superadmin role has ALL permissions (not legacy format or '*')
      const perms = superadminRole.permissions;
      const hasAllPerms = Array.isArray(perms) && ALL_PERMS.every(p => perms.includes(p));
      if (!hasAllPerms) {
        console.log('🔐 Updating superadmin role with all permissions');
        await db.update(roles)
          .set({ permissions: ALL_PERMS })
          .where(eq(roles.id, superadminRole.id));
      }
    }
    
    // Update user with superadmin role
    await db.update(users)
      .set({ roleId: superadminRole.id })
      .where(eq(users.id, userId));
      
    console.log(`✅ Superadmin role assigned to user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to assign superadmin role:', error);
  }
};

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Dynamic callback URL detection for all environments
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isReplitDeployment = process.env.REPL_SLUG || process.env.REPLIT_DEPLOYMENT || process.env.REPLIT_DOMAINS;
  
  let googleCallbackURL;
  // Use development domain for Replit development environment
  if (isDevelopment && isReplitDeployment && process.env.REPLIT_DOMAINS) {
    googleCallbackURL = `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`;
  } else if (process.env.APP_URL) {
    googleCallbackURL = `${process.env.APP_URL}/api/auth/google/callback`;
  } else if (isDevelopment && !isReplitDeployment) {
    googleCallbackURL = 'http://localhost:5000/api/auth/google/callback';
  } else {
    googleCallbackURL = 'https://www.hibowan.com/api/auth/google/callback';
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
      const existingUsers = await db.select().from(users).where(
        or(
          eq(users.googleId, profile.id),
          eq(users.email, profile.emails?.[0]?.value || '')
        )
      );
      const existingUser = existingUsers[0];

      const userEmail = profile.emails?.[0]?.value || '';
      console.log(`🔐 Google OAuth callback for email: ${userEmail}`);
      console.log(`🔐 Is superadmin email: ${isSuperadminEmail(userEmail)}`);
      
      if (existingUser) {
        console.log(`🔐 Existing user found: ${existingUser.id}, roleId: ${existingUser.roleId}`);
        // Update Google ID if not set
        if (!existingUser.googleId) {
          await db.update(users)
            .set({ googleId: profile.id })
            .where(eq(users.id, existingUser.id));
        }
        
        // Auto-assign superadmin role if email is designated (always ensure correct role)
        if (userEmail && isSuperadminEmail(userEmail)) {
          await assignSuperadminRole(existingUser.id);
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
      const newUsers = await db.insert(users).values({
        email: userEmail,
        name: profile.displayName,
        image: profile.photos?.[0]?.value,
        provider: 'google',
        googleId: profile.id,
        emailVerified: true,
      }).returning() as any[];
      const newUser = newUsers[0];
      
      // Auto-assign superadmin role if email is designated
      if (userEmail && isSuperadminEmail(userEmail)) {
        await assignSuperadminRole(newUser.id);
      }

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
  // Use development domain for Replit development environment (same as Google)
  if (isDevelopment && isReplitDeployment && process.env.REPLIT_DOMAINS) {
    facebookCallbackURL = `https://${process.env.REPLIT_DOMAINS}/api/auth/facebook/callback`;
  } else if (process.env.APP_URL) {
    facebookCallbackURL = `${process.env.APP_URL}/api/auth/facebook/callback`;
  } else if (isDevelopment && !isReplitDeployment) {
    facebookCallbackURL = 'http://localhost:5000/api/auth/facebook/callback';
  } else {
    facebookCallbackURL = 'https://www.hibowan.com/api/auth/facebook/callback';
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
      const existingUsers = await db.select().from(users).where(
        eq(users.facebookId, profile.id)
      );
      const existingUser = existingUsers[0];

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
      const newUsers = await db.insert(users).values({
        email: null, // Facebook no longer provides email by default
        name: profile.displayName,
        image: profile.photos?.[0]?.value,
        provider: 'facebook',
        facebookId: profile.id,
        emailVerified: false,
      }).returning() as any[];
      const newUser = newUsers[0];

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