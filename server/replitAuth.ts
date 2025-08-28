import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Validate required environment variables
function validateEnvironmentVariables() {
  const requiredEnvVars = [
    { name: 'REPL_ID', value: process.env.REPL_ID },
    { name: 'REPLIT_DOMAINS', value: process.env.REPLIT_DOMAINS },
    { name: 'SESSION_SECRET', value: process.env.SESSION_SECRET },
    { name: 'DATABASE_URL', value: process.env.DATABASE_URL }
  ];

  const missingVars = requiredEnvVars.filter(envVar => !envVar.value);
  
  if (missingVars.length > 0) {
    const missingVarNames = missingVars.map(envVar => envVar.name).join(', ');
    throw new Error(
      `Missing required environment variables for Replit Auth: ${missingVarNames}. ` +
      `Please ensure these are properly configured in your deployment settings.`
    );
  }
}

// Validate environment variables on module load
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('Environment validation failed:', (error as Error).message);
  throw error;
}

const getOidcConfig = memoize(
  async () => {
    try {
      const issuerUrl = process.env.ISSUER_URL ?? "https://replit.com/oidc";
      const replId = process.env.REPL_ID;
      
      if (!replId) {
        throw new Error('REPL_ID environment variable is required for OIDC configuration');
      }
      
      return await client.discovery(
        new URL(issuerUrl),
        replId
      );
    } catch (error) {
      console.error('Failed to get OIDC configuration:', (error as Error).message);
      throw new Error(`OIDC configuration failed: ${(error as Error).message}`);
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  try {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
    const databaseUrl = process.env.DATABASE_URL;
    const sessionSecret = process.env.SESSION_SECRET;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for session store');
    }
    
    if (!sessionSecret) {
      throw new Error('SESSION_SECRET environment variable is required for session security');
    }
    
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: databaseUrl,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });
    
    return session({
      secret: sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        maxAge: sessionTtl,
      },
    });
  } catch (error) {
    console.error('Failed to configure session:', (error as Error).message);
    throw new Error(`Session configuration failed: ${(error as Error).message}`);
  }
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
  try {
    app.set("trust proxy", 1);
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      try {
        const user = {};
        updateUserSession(user, tokens);
        await upsertUser(tokens.claims());
        verified(null, user);
      } catch (error) {
        console.error('Authentication verification failed:', (error as Error).message);
        verified(error as Error, null);
      }
    };

    const replitDomains = process.env.REPLIT_DOMAINS;
    if (!replitDomains) {
      throw new Error('REPLIT_DOMAINS environment variable is required');
    }

    for (const domain of replitDomains.split(",")) {
      const trimmedDomain = domain.trim();
      if (!trimmedDomain) {
        console.warn('Skipping empty domain in REPLIT_DOMAINS');
        continue;
      }
      
      try {
        const strategy = new Strategy(
          {
            name: `replitauth:${trimmedDomain}`,
            config,
            scope: "openid email profile offline_access",
            callbackURL: `https://${trimmedDomain}/api/callback`,
          },
          verify,
        );
        passport.use(strategy);
      } catch (error) {
        console.error(`Failed to setup auth strategy for domain ${trimmedDomain}:`, (error as Error).message);
        throw error;
      }
    }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      try {
        const replId = process.env.REPL_ID;
        if (!replId) {
          console.error('REPL_ID not available for logout');
          return res.redirect('/');
        }
        
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: replId,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      } catch (error) {
        console.error('Error during logout:', (error as Error).message);
        res.redirect('/');
      }
    });
  });
  } catch (error) {
    console.error('Failed to setup authentication:', (error as Error).message);
    throw new Error(`Authentication setup failed: ${(error as Error).message}`);
  }
}
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
