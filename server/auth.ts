import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development 
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }
  

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const domain = req.hostname === 'localhost' 
      ? process.env.REPLIT_DOMAINS!.split(',')[0] 
      : req.hostname;
    passport.authenticate(`replitauth:${domain}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    const domain = req.hostname === 'localhost' 
      ? process.env.REPLIT_DOMAINS!.split(',')[0] 
      : req.hostname;
    passport.authenticate(`replitauth:${domain}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // Add the user endpoint that frontend expects - check both auth systems
  app.get('/api/auth/me', async (req: any, res) => {
    try {
      console.log("🔍 /api/auth/me called - checking auth methods");
      
      // First try JWT authentication (for Google/Facebook OAuth users)
      const { getCurrentUser } = await import('./auth/jwt');
      const jwtUser = await getCurrentUser(req);
      
      if (jwtUser) {
        // User is authenticated via JWT (Google/Facebook)
        const userData = await storage.getUser(jwtUser.id);
        if (userData) {
          console.log("✅ User authenticated via JWT:", userData.email);
          return res.json(userData);
        }
      }
      
      // Fallback to Replit Auth
      console.log("🔍 Trying Replit Auth fallback, isAuthenticated:", typeof req.isAuthenticated);
      if (req.isAuthenticated && req.isAuthenticated()) {
        const user = req.user as any;
        console.log("🔍 Replit Auth user claims:", user?.claims ? "present" : "missing", user?.claims?.sub);
        if (user?.claims?.sub) {
          const userId = user.claims.sub;
          const userData = await storage.getUser(userId);
          if (userData) {
            console.log("✅ User authenticated via Replit Auth:", userData.email);
            return res.json(userData);
          } else {
            console.log("⚠️ Replit Auth user ID found but no database record:", userId);
          }
        }
      } else {
        console.log("🔍 req.isAuthenticated() returned:", req.isAuthenticated ? req.isAuthenticated() : 'not a function');
      }
      
      // No authentication found
      console.log("❌ No authentication method worked");
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("❌ Error in /api/auth/me:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}

// Unified authentication middleware that checks both JWT and Replit Auth
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    // First try JWT authentication (for Google/Facebook OAuth users)
    const { getCurrentUser } = await import('./auth/jwt');
    const jwtUser = await getCurrentUser(req);
    
    if (jwtUser) {
      console.log("✅ JWT User authenticated:", jwtUser.email);
      // Set user info for routes to access
      req.user = { claims: { sub: jwtUser.id }, email: jwtUser.email, name: jwtUser.name };
      return next();
    }
    
    // Fallback to Replit Auth
    if (req.isAuthenticated()) {
      const user = req.user as any;
      if (user?.claims?.sub) {
        console.log("✅ Replit Auth user authenticated:", user.claims.sub);
        const now = Math.floor(Date.now() / 1000);
        if (now <= user.expires_at) {
          return next();
        }

        // Try to refresh token
        const refreshToken = user.refresh_token;
        if (refreshToken) {
          const config = await getOidcConfig();
          const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
          updateUserSession(user, tokenResponse);
          return next();
        }
      }
    }
    
    // No authentication found
    console.log("❌ No authentication found for request to:", req.path);
    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};